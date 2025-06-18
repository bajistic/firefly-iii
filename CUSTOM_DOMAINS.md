 # Custom Domains for Tailscale Services

 This document shows you how to “front” your private Tailscale-only applications (e.g. phpMyAdmin, a finance dashboard) under custom public subdomains such as `phpmyadmin.bajistic.xyz` and `finance.bajistic.xyz`.

 **No changes to your existing AI-assistant codebase are required**—this is purely a DNS + reverse-proxy/networking setup.

 ## 1. Outline of the solution

 | Step | What you do                                        | Why                                                        |
 |------|---------------------------------------------------|------------------------------------------------------------|
 | 1    | Provision (or reuse) a machine/VPS with a public IP | So your subdomains can point at something publicly reachable |
 | 2    | Install & join Tailscale on that machine           | Gives it access to your tailnet & your internal services   |
 | 3    | Point your DNS records (A or CNAME) to that public IP | Lets `finance.bajistic.xyz` & `phpmyadmin.bajistic.xyz` resolve to your proxy |
 | 4    | Install a reverse‑proxy (Caddy or NGINX) on the machine | Terminates TLS for your custom domains and forwards traffic into Tailscale |
 | 5    | Configure the reverse‑proxy to route each hostname to the Tailscale IP:port of the internal server | Securely forwards traffic over the mesh |
 | 6    | Obtain/renew TLS certs automatically (Let’s Encrypt) | Ensures HTTPS on your custom domains                       |

 ## 2. Detailed Walkthrough

 ### 2.1 Provision a Public-IP Host and Join Tailscale

 Use any small cloud VM (DigitalOcean, AWS, Hetzner, etc.) or a home server with port forwarding. Then install Tailscale and authenticate it in your tailnet:

 ```bash
 curl -fsSL https://tailscale.com/install.sh | sh
 sudo tailscale up
 ```

 After joining, this proxy host can communicate over the mesh to your phpMyAdmin, finance dashboard, and any other tailnet nodes.

 ### 2.2 Point Your DNS to the Proxy’s Public IP

 Add records in your DNS provider (Cloudflare, Route 53, GoDaddy, etc.):

 | Hostname                  | Type | Value                     |
 | ------------------------- | ---- | ------------------------- |
 | `finance.bajistic.xyz`    | A    | `<PUBLIC_IP_OF_PROXY>`    |
 | `phpmyadmin.bajistic.xyz` | A    | `<PUBLIC_IP_OF_PROXY>`    |

 If the proxy’s IP changes, consider a dynamic DNS solution or an API-driven update (e.g. Cloudflare API).

 ### 2.3 Run a Reverse‑Proxy with Automatic TLS

 You can use **Caddy** for zero-config HTTPS or **NGINX + certbot**. Below are minimal examples.

 #### Option A: Caddy (zero‑config HTTPS)

 1. Install Caddy on your proxy VM.
 2. Create `/etc/caddy/Caddyfile`:

    ```caddyfile
    finance.bajistic.xyz {
      reverse_proxy 100.x.y.z:3000
    }

    phpmyadmin.bajistic.xyz {
      reverse_proxy 100.x.y.z:8080
    }
    ```

    Replace `100.x.y.z` with the Tailscale IP of your finance dashboard and phpMyAdmin hosts (and the correct ports).

 3. Reload Caddy:

    ```bash
    sudo systemctl reload caddy
    ```

 #### Option B: NGINX + certbot

 1. Install NGINX and certbot.
 2. Create `/etc/nginx/sites-available/finance.conf`:

    ```nginx
    server {
      listen 80;
      server_name finance.bajistic.xyz;

      location / {
        proxy_pass http://100.x.y.z:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
      }
    }
    ```

    And `/etc/nginx/sites-available/phpmyadmin.conf`:

    ```nginx
    server {
      listen 80;
      server_name phpmyadmin.bajistic.xyz;

      location / {
        proxy_pass http://100.x.y.z:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
      }
    }
    ```

 3. Enable & test:

    ```bash
    sudo ln -s /etc/nginx/sites-available/finance.conf /etc/nginx/sites-enabled/
    sudo ln -s /etc/nginx/sites-available/phpmyadmin.conf /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    ```

 4. Obtain TLS for both hosts:

    ```bash
    sudo certbot --nginx \
      -d finance.bajistic.xyz \
      -d phpmyadmin.bajistic.xyz
    ```

    Certbot will configure NGINX for HTTPS and set up auto-renewals.

 ## 3. Alternative: Cloudflare Tunnel

 If you prefer not to maintain a public‑IP proxy or open firewall ports, use Cloudflare Tunnel:

 ```bash
 # On your finance dashboard host:
 cloudflared tunnel login
 cloudflared tunnel create finance
 cloudflared tunnel route dns finance finance.bajistic.xyz
 cloudflared tunnel run finance --url http://localhost:3000
 ```

 Repeat for phpMyAdmin. Cloudflare handles DNS, TLS, and a stable outbound tunnel—no public IP required.

 ## 4. Wrap‑Up

 1. **DNS → Proxy or Tunnel**  
 2. **Reverse‑Proxy (Caddy/NGINX) or Cloudflare Tunnel**  
 3. **HTTPS via Let’s Encrypt or Cloudflare**  

 You’re all set! Now you can browse:

 - `https://finance.bajistic.xyz`
 - `https://phpmyadmin.bajistic.xyz`

 Feel free to tweak ports, hostnames, or tooling to match your environment.