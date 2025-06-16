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
  ScrapeJobsSchema,
  FavoriteJobSchema,
]);

module.exports = { UnifiedActionSchema };


