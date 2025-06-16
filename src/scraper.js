const fs = require('fs');
const path = require('path');
const axios = require('axios');
let cheerio;
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = null; }

// Timing constants (in seconds)
const MIN_DELAY_BETWEEN_REQUESTS = 7;
const MAX_DELAY_BETWEEN_REQUESTS = 20;
const MIN_DELAY_PAGE_INTERACTION = 2;
const MAX_DELAY_PAGE_INTERACTION = 5;
const REQUEST_TIMEOUT = 25000;
const BROWSER_NAVIGATION_TIMEOUT = 90000;
const BROWSER_ACTION_TIMEOUT = 30000;

const DESKTOP_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
];
const IPHONE_USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/117.0.5938.108 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaders(simulateIphone = false, referer = null) {
  const userAgent = simulateIphone
    ? IPHONE_USER_AGENTS[Math.floor(Math.random() * IPHONE_USER_AGENTS.length)]
    : DESKTOP_USER_AGENTS[Math.floor(Math.random() * DESKTOP_USER_AGENTS.length)];
  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': referer || 'https://www.google.com/',
  };
}

function createAxiosInstance(proxy) {
  const config = { timeout: REQUEST_TIMEOUT };
  if (proxy) {
    config.proxy = false;
    const { HttpsProxyAgent } = require('https-proxy-agent');
    config.httpsAgent = new HttpsProxyAgent(proxy);
  }
  return axios.create(config);
}

async function fetchViaScrapingBee(url, simulateIphone) {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    console.error('SCRAPINGBEE_API_KEY not set for ScrapingBee mode');
    return null;
  }
  const params = {
    api_key: apiKey,
    url,
    render_js: 'true',
    premium_proxy: 'true',
    device: simulateIphone ? 'mobile' : 'desktop',
    timeout: Math.floor(BROWSER_NAVIGATION_TIMEOUT * 1.2),
  };
  try {
    const resp = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params,
      timeout: (BROWSER_NAVIGATION_TIMEOUT / 1000) + 15000,
    });
    return resp.data;
  } catch (err) {
    console.warn(`ScrapingBee fetch failed for ${url}: ${err.message}`);
    return null;
  }
}

async function fetchJobPageBrowser(url, opts) {
  if (!playwright) {
    console.error('Playwright not available for browser mode');
    return null;
  }
  const {
    browser,
    context,
    browserWs,
    simulateIphone,
    proxy,
    reuseContext,
  } = opts;
  let localBrowser = browser;
  let localContext = context;
  let createdBrowser = false;
  try {
    if (!browserWs && !localBrowser) {
      localBrowser = await playwright.chromium.launch({ headless: true, args: ['--no-sandbox'] });
      createdBrowser = true;
    } else if (browserWs && !localBrowser) {
      localBrowser = await playwright.chromium.connectOverCDP(browserWs);
    }
    if (!localBrowser) throw new Error('Browser launch/connect failed');
    if (!reuseContext || !localContext) {
      const contextOpts = { ignoreHTTPSErrors: true };
      if (proxy) contextOpts.proxy = { server: proxy };
      if (simulateIphone) Object.assign(contextOpts, playwright.devices['iPhone 13 Pro']);
      localContext = await localBrowser.newContext(contextOpts);
    }
    const page = await localContext.newPage();
    await sleep(randomBetween(MIN_DELAY_PAGE_INTERACTION, MAX_DELAY_PAGE_INTERACTION) * 1000);
    await page.goto(url, { timeout: BROWSER_NAVIGATION_TIMEOUT, waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: BROWSER_ACTION_TIMEOUT }).catch(() => {});
    const html = await page.content();
    await page.close();
    return html;
  } catch (err) {
    console.error(`Browser fetch error for ${url}: ${err.message}`);
    return null;
  } finally {
    if (!reuseContext && localContext) await localContext.close();
    if (createdBrowser && localBrowser) await localBrowser.close();
  }
}

async function fetchJobPage(url, opts) {
  const {
    axiosInstance,
    browser,
    context,
    browserWs,
    useBrowser,
    useScrapingBee,
    proxy,
    simulateIphone,
    reuseContext,
  } = opts;
  if (useScrapingBee) {
    const html = await fetchViaScrapingBee(url, simulateIphone);
    if (html) return html;
  }
  if (useBrowser) {
    const html = await fetchJobPageBrowser(url, opts);
    if (html) return html;
  }
  await sleep(randomBetween(MIN_DELAY_PAGE_INTERACTION, MAX_DELAY_PAGE_INTERACTION) * 1000);
  try {
    const headers = getHeaders(simulateIphone);
    const resp = await axiosInstance.get(url, { headers });
    return resp.data;
  } catch (err) {
    console.error(`HTTP fetch error for ${url}: ${err.message}`);
    return null;
  }
}

function extractJobDetails(html, url) {
  if (!cheerio) cheerio = require('cheerio');
  const $ = cheerio.load(html);
  let title = $('h1[class*=title], h1[id*=title], .job-posting-title, .job-title, [class*=jobTitle]').first().text().trim();
  if (!title) title = $('title').first().text().split('|')[0].trim() || 'Unknown Title';
  let company = $('.company-name, .employer-name, [class*=companyName], [itemprop="hiringOrganization"] [itemprop="name"]').first().text().trim() || 'Unknown Company';
  let location = $('.job-location, [class*=jobLocation], [itemprop="jobLocation"] [itemprop="addressLocality"]').first().text().trim() || 'Not Specified';
  let description = '';
  const descEl = $('[itemprop="description"], .jobDescription, .job-details-description').first();
  if (descEl.length) {
    description = descEl.text().trim();
  } else {
    description = $('body').text().trim();
  }
  return { title, company, location, description, url };
}

function formatToMarkdown(job) {
  const desc = job.description.length > 4000 ? job.description.slice(0, 3997) + '...' : job.description;
  return `
## ${job.title}

**Company**: ${job.company}
**Location**: ${job.location}
**Source**: [${job.url}](${job.url})

### Description
${desc}

---
`;
}

async function scrapeJobs(jobUrls, options = {}) {
  const {
    skip_network_check = false,
    use_browser = false,
    proxy_list_file = null,
    browser_ws = null,
    use_scrapingbee = false,
    session_id = null,
    simulate_iphone = false,
    reuse_playwright_context_config = true,
  } = options;
  let proxies = [];
  if (proxy_list_file) {
    try {
      const data = await fs.promises.readFile(proxy_list_file, 'utf8');
      proxies = data.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    } catch (_) {}
  }
  let pw = null, browser = null, context = null;
  if (use_browser && playwright) {
    pw = playwright;
    browser = await pw.chromium.launch({ headless: true });
    if (reuse_playwright_context_config) context = await browser.newContext();
  }
  const jobs = [];
  for (const url of jobUrls) {
    const proxy = proxies.length ? proxies[Math.floor(Math.random() * proxies.length)] : null;
    const axiosInstance = createAxiosInstance((use_browser || use_scrapingbee) ? null : proxy);
    const html = await fetchJobPage(url, { axiosInstance, browser, context, browserWs: browser_ws,
      useBrowser: use_browser, useScrapingBee: use_scrapingbee, proxy,
      simulateIphone: simulate_iphone, reuseContext: reuse_playwright_context_config });
    if (html) {
      jobs.push(extractJobDetails(html, url));
    } else {
      jobs.push({ title: 'Failed to scrape', company: '', location: '', description: `Failed to fetch ${url}`, url });
    }
    const delay = randomBetween(MIN_DELAY_BETWEEN_REQUESTS, MAX_DELAY_BETWEEN_REQUESTS) * 1000;
    await sleep(delay);
  }
  if (context) await context.close();
  if (browser) await browser.close();
  const markdown = jobs.map(formatToMarkdown).join('\n');
  return { jobs, markdown };
}

module.exports = { scrapeJobs };