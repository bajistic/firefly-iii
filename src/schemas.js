const CoverLetterJsonSchema = {
  type: 'object',
  properties: {
    cover_letters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          src: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              suffix: { type: 'string' },
              address: { type: 'string' },
              date: { type: 'string' },
              title: { type: 'string' },
              greeting: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['company', 'suffix', 'address', 'date', 'title', 'greeting', 'content'],
            additionalProperties: false,
          },
          isFile: { type: 'boolean' },
          labelReady: { type: 'boolean' },
        },
        required: ['src', 'isFile', 'labelReady'],
        additionalProperties: false,
      },
    },
  },
  required: ['cover_letters'],
  additionalProperties: false,
};

const TransactionJsonSchema = {
  type: 'object',
  properties: {
    shop: { type: 'string' },
    date: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
    time: { type: 'string', pattern: '^[0-9]{2}:[0-9]{2}:[0-9]{2}$', nullable: true },
    total: { type: 'number' },
    receipt_path: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'integer', nullable: true },
          price: { type: 'number' },
          category: { type: 'string' },
        },
        required: ['name', 'price', 'category'],
        additionalProperties: false,
      },
    },
  },
  required: ['total', 'date', 'items'],
  additionalProperties: false,
};


const handleNaturalCommandParamsSchema = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: [
        "create_transaction",
        "create_event",
        "create_todo",
        "create_cover_letter",
        "add_income",
        "add_account",
        "execute_sql_query",
        "propose_schema_migration",
        "scrape_jobs",
        "favorite_job",
        "send_email",
        "list_messages",
        "get_message",
        "modify_message",
        "respond"
      ],
      description: "The specific action to perform."
    },
    // For 'respond' action
    message: {
      type: "string",
      description: "The message to respond with (used when action is 'respond')."
    },
    // For 'create_transaction' action
    transaction: {
      type: "object",
      description: "Details for creating a transaction (used when action is 'create_transaction').",
      properties: {
        shop: { type: ["string", "null"], description: "Name of the shop or vendor." },
        date: { type: "string", format: "date", description: "Date of transaction (YYYY-MM-DD)." },
        time: { type: ["string", "null"], format: "time", description: "Time of transaction (HH:MM:SS) (optional)." },
        total: { type: "number", description: "Total amount of the transaction." },
        currency: { type: "string", enum: ["EUR", "CHF", "USD"], default: "CHF", description: "Currency code." },
        discount: { type: ["number", "null"], description: "Discount amount (optional)." },
        account_id: { type: ["integer", "null"], description: "ID of the account used (optional)." }, // Changed to integer
        items: {
          type: "array",
          description: "Array of items in the transaction.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the item." },
              quantity: { type: "number", description: "Quantity of the item." },
              price: { type: "number", description: "Price per unit of the item." },
              category: { type: "string", description: "Category of the item." }, // Added category based on previous schemas
              discount: { type: ["number", "null"], description: "Discount on this specific item (optional)." }
            },
            required: ["name", "quantity", "price", "category",] // Added category to required
          }
        }
      },
      // 'required' here makes these fields mandatory *if* the 'transaction' object is provided.
      required: ["date", "total", "items"] // shop, time, etc., can be optional within the transaction object
    },
    // For 'add_income' action
    income: {
      type: "object",
      description: "Details for adding income (used when action is 'add_income').",
      properties: {
        type: { type: "string", enum: ["salary", "freelance", "investment", "gift", "other"], description: "Type of income." },
        amount: { type: "number", description: "Amount of income received." },
        date: { type: "string", format: "date", description: "Date income was received (YYYY-MM-DD)." },
        description: { type: ["string", "null"], description: "Description of the income (optional)." },
        account_id: { type: ["integer", "null"], description: "ID of the account to deposit into (optional)." }
      },
      required: ["type", "amount", "date"]
    },
    // For 'add_account' action
    account: {
      type: "object",
      description: "Details for adding an account (used when action is 'add_account').",
      properties: {
        name: { type: "string", description: "Name of the new account." },
        description: { type: ["string", "null"], description: "Description of the account (optional)." },
        type: { type: "string", enum: ["main", "savings", "credit_card", "cash", "investment"], description: "Type of account." },
        balance: { type: ["number", "null"], default: 0.0, description: "Initial balance of the account (optional)." }
      },
      required: ["name", "type"]
    },
    // For 'create_event' action
    events: {
      type: "array",
      description: "An array of events to create (used when action is 'create_event').",
      items: {
        type: "object",
        properties: {
          summary: { type: "string", description: "The title or summary of the event." },
          description: { type: ["string", "null"], description: "Fuller description for the event (optional)." }, // Made nullable
          startDateTime: { type: "string", format: "date-time", description: "Start date and time in ISO 8601 format." },
          endDateTime: { type: "string", format: "date-time", description: "End date and time in ISO 8601 format." },
          location: { type: ["string", "null"], description: "Location of the event (optional)." } // Made nullable
        },
        required: ["summary", "startDateTime", "endDateTime"]
      }
    },
    // For 'create_todo' action
    todos: {
      type: "array",
      description: "An array of to-do items to create (used when action is 'create_todo').",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the to-do item." },
          notes: { type: ["string", "null"], description: "Additional notes for the to-do (optional)." },
          // 'when' and 'deadline' are often the same concept or 'dueDate'.
          // Let's use 'dueDate' for consistency with previous schemas.
          // Your 'Things' app uses 'when' for due date and 'deadline' for a hard deadline.
          // For simplicity in AI, stick to one or be very clear.
          // For 'Things' URL scheme: 'when' (due date), 'deadline' (hard deadline)
          when: { type: ["string", "null"], description: "Due date/time for the to-do (e.g., YYYY-MM-DD, 'today', 'tomorrow evening')." },
          deadline: { type: ["string", "null"], description: "Hard deadline for the to-do (e.g., YYYY-MM-DD)." },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for the to-do item (optional)."
          },
          checklist: { // Added from your Zod schemas
            type: "array",
            items: { type: "string" },
            default: [],
            description: "A list of checklist items (optional)."
          }
        },
        required: ["title"]
      }
    },
    // For 'create_cover_letter' (initial call)
    cover_letters: {
      type: "array",
      minItems: 1,
      description: "Details for creating cover letters (used when action is 'create_cover_letter').",
      items: {
        type: "object",
        properties: {
          src: { type: "string", description: "The full text of the job advertisement or description." }
        },
        required: ["src"]
      }
    },
    // For 'scrape_jobs' action
    job_urls: {
      type: "array",
      description: "Array of job listing URLs to scrape.",
      items: { type: "string", format: "uri" }
    },
    // For 'favorite_job' action
    job_id: {
      type: "integer",
      description: "ID of the job listing to mark as favorite (corresponds to the 'jobs' table)."
    },
    favorite: {
      type: "boolean",
      description: "Whether to set (true) or unset (false) the favorite flag for the job (default: true).",
      default: true
    },
    skip_network_check: {
      type: "boolean",
      description: "Skip initial network connectivity check for scraping."
    },
    use_browser: {
      type: "boolean",
      description: "Use headless browser (Playwright) for fetching pages."
    },
    proxy_list_file: {
      type: "string",
      description: "Path to a proxy list file for HTTP/SOCKS proxies (optional)."
    },
    browser_ws: {
      type: "string",
      description: "WebSocket endpoint for remote browser (optional)."
    },
    use_scrapingbee: {
      type: "boolean",
      description: "Use ScrapingBee API for fetching pages (optional)."
    },
    session_id: {
      type: "string",
      description: "Session ID for proxy session rotation (optional)."
    },
    simulate_iphone: {
      type: "boolean",
      description: "Simulate iPhone User-Agent for fetching pages."
    },
    reuse_playwright_context_config: {
      type: "boolean",
      description: "Reuse a single Playwright context for all URLs (optional)."
    },
    // For 'execute_sql_query'
    query: {
      type: "string",
      description: "The SQL query to execute (used when action is 'execute_sql_query')."
    },
    // For 'propose_schema_migration'
    migration_description: {
      type: "string",
      description: "Description of the proposed schema change (used with 'propose_schema_migration')."
    },
    sql_statements: {
      type: "array",
      items: { type: "string" },
      description: "SQL DDL statements for the proposed migration (used with 'propose_schema_migration')."
    },
    // For 'send_email' action
    emails: {
      type: "array",
      description: "Array of email objects to send (used when action is 'send_email').",
      items: {
        type: "object",
        properties: {
          to: { type: "string", format: "email", description: "Recipient email address." },
          cc: { type: "array", items: { type: "string", format: "email" }, default: [], description: "CC email addresses." },
          bcc: { type: "array", items: { type: "string", format: "email" }, default: [], description: "BCC email addresses." },
          subject: { type: "string", description: "Email subject." },
          body: { type: "string", description: "Email body text." },
          attachments: { type: "array", items: { type: "string" }, default: [], description: "Attachments file paths or URLs (optional)." }
        },
        required: ["to", "subject", "body"]
      }
    },
    // For 'list_messages' action
    max_results: { type: "integer", description: "Maximum number of messages to list (used when action is 'list_messages').", default: 10 },
    // For 'get_message' and 'modify_message' actions
    message_id: { type: "string", description: "The ID of the message (used when action is 'get_message' or 'modify_message')." },
    // For 'modify_message' action
    add_labels: { type: "array", items: { type: "string" }, default: [], description: "Labels to add to the message (used when action is 'modify_message')." },
    remove_labels: { type: "array", items: { type: "string" }, default: [], description: "Labels to remove from the message (used when action is 'modify_message')." }
  },
  required: ["action"], // Only 'action' is strictly required at the top level.
  // The relevance of other fields depends on the value of 'action'.

  // To make this stricter, you'd use 'dependencies' or ideally 'if/then/else' (draft-07)
  // or 'oneOf'/'anyOf' with each member defining its own required properties.
  // For OpenAI, keeping it like this might be okay, and your Zod validation catches issues.
  // However, a 'oneOf' or 'anyOf' structure is generally more robust for discriminated unions.
  "$schema": "http://json-schema.org/draft-07/schema#"
};

const tools = [{
  type: 'function',
  function: {
    name: 'handle_natural_command',
    description: 'Parses natural language into an action object. Provide the "action" field and then only the fields relevant to that action.',
    parameters: handleNaturalCommandParamsSchema
  }
}];

module.exports = { CoverLetterJsonSchema, TransactionJsonSchema, tools };
