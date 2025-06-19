const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

// Respond action
const RespondSchema = z.object({
  action: z.literal('respond'),
  message: z.string(),
});

// Calendar Event action
const CreateEventSchema = z.object({
  action: z.literal('create_event'),
  events: z.array(
    z.object({
      summary: z.string().min(1, "Summary cannot be empty"),
      startDateTime: z.string().min(1, "Start date/time cannot be empty"), // Just ensure it's a non-empty string
      endDateTime: z.string().min(1, "End date/time cannot be empty"),   // Just ensure it's a non-empty string
      location: z.string().optional().default(""), // Or .nullable().optional()
      description: z.string().optional().default(""), // Or .nullable().optional()
    })
  ).min(1),
});

// Things To-Do action
const CreateTodoSchema = z.object({
  action: z.literal('create_todo'),
  todos: z.array(
    z.object({
      title: z.string(),
      notes: z.string().optional().default(""),
      checklist: z.array(z.string()).optional().default([]),
      dueDate: z.string().optional(), // can be ISO or relative string like "today"
    })
  ),
});

// Cover Letter action
// const CreateCoverLetterSchema = z.object({
//   action: z.literal('create_cover_letter'),
//   cover_letters: z.array(
//     z.object({
//       src: z.object({
//         company: z.string(),
//         suffix: z.string(),
//         address: z.string(),
//         date: z.string(),
//         title: z.string(),
//         greeting: z.string(),
//         content: z.string(),
//       }),
//       isFile: z.boolean().optional(),
//       labelReady: z.boolean().optional(),
//     })
//   ),
// });

const CreateCoverLetterSchema = z.object({
  action: z.literal('create_cover_letter'),
  cover_letters: z.array(
    z.object({
      src: z.string(),
    })
  ),
});

const CreateTransactionSchema = z.object({
  action: z.literal('create_transaction'),
  transaction: z.object({
    shop: z.string().nullable(),
    date: z.string(),
    time: z.string().nullable(),
    total: z.number(),
    currency: z.enum(['EUR', 'CHF', 'USD']).default('CHF'),
    discount: z.number().nullable(),
    account_id: z.number().nullable().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        category: z.string(),
        discount: z.number().nullable().optional(),
      })
    ).min(1, "At least one item is required for a transaction"),
  }),
});

const IncomeSchema = z.object({
  type: z.enum(['salary', 'freelance', 'investment', 'other']),
  amount: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().nullable(),
  account_id: z.number().int().nullable(),
});

const AccountSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['main', 'savings', 'credit_card']),
  balance: z.number().nullable(),
});

const AddIncomeActionSchema = z.object({
  action: z.literal('add_income'),
  income: IncomeSchema,
});

const AddAccountActionSchema = z.object({
  action: z.literal('add_account'),
  account: AccountSchema,
});

// Scrape Jobs action
const ScrapeJobsSchema = z.object({
  action: z.literal('scrape_jobs'),
  job_urls: z.array(z.string().url()).min(1, 'At least one URL is required'),
  skip_network_check: z.boolean().optional(),
  use_browser: z.boolean().optional(),
  proxy_list_file: z.string().optional(),
  browser_ws: z.string().optional(),
  use_scrapingbee: z.boolean().optional(),
  session_id: z.string().optional(),
  simulate_iphone: z.boolean().optional(),
  reuse_playwright_context_config: z.boolean().optional(),
});

// Favorite Job action
const FavoriteJobSchema = z.object({
  action: z.literal('favorite_job'),
  job_id: z.number().int().describe("ID of the job listing to mark as favorite"),
  favorite: z.boolean().optional().describe("If true, mark as favorite; if false, remove from favorites"),
});

// Gmail actions
const SendEmailSchema = z.object({
  action: z.literal('send_email'),
  emails: z.array(
    z.object({
      to: z.string().email(),
      cc: z.array(z.string().email()).optional().default([]),
      bcc: z.array(z.string().email()).optional().default([]),
      subject: z.string().min(1),
      body: z.string(),
      attachments: z.array(z.string()).optional().default([]),
    })
  ).min(1, 'At least one email is required'),
});
const ListMessagesSchema = z.object({
  action: z.literal('list_messages'),
  query: z.string().optional().default(''),
  max_results: z.number().int().optional().default(10),
});
const GetMessageSchema = z.object({
  action: z.literal('get_message'),
  message_id: z.string(),
});
const ModifyMessageSchema = z.object({
  action: z.literal('modify_message'),
  message_id: z.string(),
  add_labels: z.array(z.string()).optional().default([]),
  remove_labels: z.array(z.string()).optional().default([]),
});

// New Schema for SQL Query
const SqlQueryArgsSchema = z.object({
  query: z.string().describe("The SQL query to execute. Primarily for SELECT. Use other actions for INSERT/UPDATE/DELETE where possible. Exercise caution with DML statements."),
});
const SqlQueryActionSchema = z.object({
  action: z.literal('execute_sql_query'),
  query: z.string().describe("The SQL query to execute. Primarily for SELECT. Use other actions for INSERT/UPDATE/DELETE where possible. Exercise caution with DML statements."), // Simpler: payload directly in action
});

// Process Receipt File action
const ProcessReceiptSchema = z.object({
  action: z.literal('process_receipt_file'),
  file_path: z.string().describe("Path to the receipt file to process (PDF, JPG, PNG, HEIC)"),
  description: z.string().optional().default("Process this receipt").describe("Optional description of the receipt content"),
});

// Search Files action
const SearchFilesSchema = z.object({
  action: z.literal('search_files'),
  pattern: z.string().describe("File pattern to search for (e.g., '*anthropic*receipt*', '*.pdf')"),
  directory: z.string().optional().default("uploads").describe("Directory to search in"),
  timespan: z.string().optional().describe("Time constraint (e.g., '7d', '1w', '1m' for days, weeks, months)"),
  max_results: z.number().int().optional().default(50).describe("Maximum number of files to return"),
});

// Search Gmail action
const SearchGmailSchema = z.object({
  action: z.literal('search_gmail'),
  query: z.string().describe("Gmail search query (e.g., 'from:billing@anthropic.com newer_than:7d')"),
  max_results: z.number().int().optional().default(20).describe("Maximum number of emails to return"),
  download_attachments: z.boolean().optional().default(false).describe("Whether to download PDF/image attachments"),
});

// Process Multiple Receipts action
const ProcessMultipleReceiptsSchema = z.object({
  action: z.literal('process_multiple_receipts'),
  sources: z.array(z.string()).describe("Sources to process: ['files', 'gmail', 'both']"),
  file_paths: z.array(z.string()).optional().describe("Specific file paths if sources includes 'files'"),
  email_attachments: z.array(z.string()).optional().describe("Email attachment paths if sources includes 'gmail'"),
  confirmation_threshold: z.number().optional().default(80).describe("Confidence threshold below which user confirmation is required"),
});

// Request Confirmation action
const RequestConfirmationSchema = z.object({
  action: z.literal('request_confirmation'),
  message: z.string().describe("Message to display to user requesting confirmation"),
  options: z.array(z.string()).optional().describe("Available options for user to choose from"),
  context: z.record(z.any()).optional().describe("Context data to preserve for follow-up actions"),
  timeout: z.number().int().optional().default(300).describe("Timeout in seconds for user response"),
});

// Claude Code Administrative Tasks action
const ClaudeCodeAdminSchema = z.object({
  action: z.literal('claude_code_admin'),
  task: z.string().describe("The administrative task to perform"),
  type: z.enum(["file_management", "analysis", "maintenance", "reporting", "general"]).describe("Type of administrative task"),
  context: z.record(z.any()).optional().describe("Additional context for the task"),
});

// Command Suggestions action
const CommandSuggestionsSchema = z.object({
  action: z.literal('suggest_commands'),
  category: z.enum(["all", "finance", "admin", "receipts", "reports"]).optional().default("all").describe("Category of commands to suggest"),
  count: z.number().optional().default(10).describe("Number of suggestions to return"),
});

// Agentic Plan Step
const PlanStepSchema = z.object({
  action: z.string().describe("Action to execute in this step"),
  parameters: z.record(z.any()).describe("Parameters for the action"),
  condition: z.string().optional().describe("Condition to check before executing (e.g., 'if_no_files_found', 'if_confidence_low')"),
  fallback: z.object({
    action: z.string(),
    parameters: z.record(z.any())
  }).optional().describe("Fallback action if main action fails"),
  description: z.string().optional().describe("Human-readable description of this step"),
});

// Agentic Plan Execution action
const ExecutePlanSchema = z.object({
  action: z.literal('execute_plan'),
  goal: z.string().describe("High-level goal this plan aims to accomplish"),
  steps: z.array(PlanStepSchema).min(1).describe("Ordered list of steps to execute"),
  confirmation_needed: z.boolean().optional().default(false).describe("Whether user confirmation is needed before execution"),
  progress_updates: z.boolean().optional().default(true).describe("Whether to send progress updates to user"),
});

// Unified Actions Schema
const UnifiedActionSchema = z.discriminatedUnion("action", [
  RespondSchema,
  CreateEventSchema,
  CreateTodoSchema,
  CreateCoverLetterSchema,
  CreateTransactionSchema,
  AddAccountActionSchema,
  AddIncomeActionSchema,
  SendEmailSchema,
  ListMessagesSchema,
  GetMessageSchema,
  ModifyMessageSchema,
  SqlQueryActionSchema,
  ProcessReceiptSchema,
  ScrapeJobsSchema,
  FavoriteJobSchema,
  SearchFilesSchema,
  SearchGmailSchema,
  ProcessMultipleReceiptsSchema,
  RequestConfirmationSchema,
  ClaudeCodeAdminSchema,
  CommandSuggestionsSchema,
  ExecutePlanSchema,
]);

module.exports = { UnifiedActionSchema, ClaudeCodeAdminSchema, CommandSuggestionsSchema };


