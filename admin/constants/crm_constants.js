import { INDUSTRIES } from "@/constants/general_constants";
export const RECORD_FOR_OPTIONS = [
  { label: "Contacts", value: "contacts" },
  { label: "Leads", value: "leads" },
];
export const RELATED_TO_OPTIONS = [
  { label: "Account", value: "accounts" },
  { label: "Deal", value: "deals" },
  { label: "Campaign", value: "campaigns" },
];
/*
export const REMINDER_OPTIONS = [
  { label: "5 minutes before", value: "1" },
  { label: "10 minutes before", value: "2" },
  { label: "15 minutes before", value: "3" },
  { label: "30 minutes before", value: "4" },
];
*/
export const REMINDER_OPTIONS = [
  { label: "5 minutes before", value: "5 minutes before" },
  { label: "10 minutes before", value: "10 minutes before" },
  { label: "15 minutes before", value: "15 minutes before" },
  { label: "30 minutes before", value: "30 minutes before" },
];
export const PRIORITIES_OPTIONS = [
  { label: String("High"), value: String("High") },
  { label: String("Highest"), value: String("Highest") },
  { label: String("Low"), value: String("low") },
  { label: String("Lowest"), value: String("Lowest") },
  { label: String("Normal"), value: String("normal") },
];
export const LAST_ACTIVITY = [
  { label: "Last 24 Hours", value: "last_24_hours" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
];

// =====================================
//  CALLS CONSTANTS - Starting
// =====================================
export const CALLS_PURPOSE_OPTIONS = [
  { label: "Prospecting", value: "1" },
  { label: "Administrative", value: "2" },
  { label: "Negotiation", value: "3" },
  { label: "Demo", value: "4" },
  { label: "Project", value: "5" },
  { label: "Desk", value: "6" },
];
export const CALLS_TYPES_OPTIONS = [
  { label: String("Outbound"), value: String("1") },
  { label: String("Inbound"), value: String("2") },
  { label: String("Missed"), value: String("3") },
];
export const CALLS_OUTGOING_STATUS_OPTIONS = [
  { label: String("Scheduled"), value: String("1") },
  { label: String("Completed"), value: String("2") },
];
export const CALLS_STATUS_OPTIONS = [
  { label: String("Scheduled"), value: String("1") },
  { label: String("Connected Calls"), value: String("2") },
  { label: String("Missed"), value: String("3") },
  { label: String("Over Due"), value: String("4") },
  { label: String("Completed"), value: String("5") },
];
export const CALLS_AVAILABLE_VIEWS = [
  {
    title: "Calls Ownership",
    options: [
      { label: "All Calls", value: "all_calls", default: true },
      { label: "My Calls", value: "my_calls", default: true },
      { label: "Calls Today", value: "calls_today", default: true },
      { label: "Calls This Week", value: "calls_this_week", default: true },
      { label: "Missed Calls", value: "missed_calls", default: true },
      { label: "Connected Calls", value: "connected_calls", default: true },
      { label: "Favorite Calls", value: "favorite_calls" },
    ],
  },
  {
    title: "Relation-Based Views",
    options: [
      // { label: "Related To Contacts", value: "related_to_contacts" },
      // { label: "Related To Leads", value: "related_to_leads" },
      { label: "Related To Accounts", value: "related_to_accounts" },
      { label: "Related To Deals", value: "related_to_deals" },
    ],
  },
];
export const CALLS_INITIAL_VIEWS = CALLS_AVAILABLE_VIEWS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
export const CALLS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Subject", value: "subject", default: true },
      { label: "Call Start Time", value: "start_time", default: true },
      { label: "Call Duration", value: "duration", default: true },
      { label: "Related To", value: "related_to" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Call Owner", value: "owner_id" },
      { label: "Assigned Team", value: "assigned_to_id", default: true },
    ],
  },
];
export const CALLS_INITIAL_FILTERS = CALLS_AVAILABLE_FILTERS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
// =====================================
//  CALLS CONSTANTS - Ending
// =====================================

// =====================================
//  MEETINGS CONSTANTS - Starting
// =====================================
export const MEETINGS_PURPOSE_OPTIONS = [
  { label: "Prospecting", value: "1" },
  { label: "Administrative", value: "2" },
  { label: "Negotiation", value: "3" },
  { label: "Demo", value: "4" },
  { label: "Project", value: "5" },
  { label: "Desk", value: "6" },
];
export const MEETINGS_STATUS_OPTIONS = [
  { label: String("Pending"), value: String("1") },
  { label: String("Scheduled"), value: String("2") },
  { label: String("Missed"), value: String("3") },
  { label: String("Over Due"), value: String("4") },
  { label: String("Completed"), value: String("5") },
];
export const MEETINGS_VENUES = [
  { label: String("in-office"), value: String("in-office") },
  { label: String("client location"), value: String("client location") },
];
export const MEETINGS_RELATED_TO_OPTIONS = [
  { label: "Account", value: "accounts" },
  { label: "Deal", value: "deals" },
  { label: "Campaign", value: "campaigns" },
];
export const MEETINGS_REMINDER_OPTIONS = [
  { label: String("5 minutes before"), value: String("5 minutes before") },
  { label: String("10 minutes before"), value: String("10 minutes before") },
  { label: String("15 minutes before"), value: String("15 minutes before") },
  { label: String("30 minutes before"), value: String("30 minutes before") },
];
export const MEETINGS_AVAILABLE_VIEWS = [
  {
    title: "Meetings Ownership",
    options: [
      { label: "All Meetings", value: "all_meetings", default: true },
      { label: "My Meetings", value: "my_meetings", default: true },
      { label: "Favorite Meetings", value: "favorite_meetings" },
    ],
  },
  {
    title: "Date-Based Smart Views",
    options: [
      { label: "Today's Meetings", value: "today_meetings", default: true },
      {
        label: "This Week's Meetings",
        value: "this_week_meetings",
        default: true,
      },
      { label: "Upcoming Meetings", value: "upcoming_meetings", default: true },
      { label: "Past Meetings", value: "past_meetings", default: true },
    ],
  },
  {
    title: "Relation-Based Views",
    options: [
      { label: "Related to Accounts", value: "related_to_accounts" },
      { label: "Related to Deals", value: "related_to_deals" },
    ],
  },
];
export const MEETINGS_INITIAL_VIEWS = MEETINGS_AVAILABLE_VIEWS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
export const MEETINGS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Meeting Venue", value: "venue", default: true },
      { label: "Location", value: "location", default: true },
    ],
  },
  {
    title: "Date & Time",
    options: [
      {
        label: "Meeting Start Time",
        value: "start_time",
        default: true,
      },
      { label: "Meetings End Time", value: "end_time" },
      // { label: "All Day", value: "all_day" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Meeting Owner", value: "owner_id" },
      // { label: "Assigned Team", value: "assigned_team" },
      // { label: "Participants", value: "participants" },
      //{ label: "Related To (account, deal)", value: "related_to" },
    ],
  },
  {
    title: "Reminder & Status",
    options: [
      // { label: "Participants Reminder", value: "participants_reminder" },
      { label: "Meeting Status", value: "status_id" },
    ],
  },
];
export const MEETINGS_INITIAL_FILTERS = MEETINGS_AVAILABLE_FILTERS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
// =====================================
//  MEETINGS CONSTANTS - Ending
// =====================================

// =====================================
//  TASKS CONSTANTS - Starting
// =====================================
export const TASKS_PRIORITIES_OPTIONS = [
  { label: "Low", value: "1" },
  { label: "Medium", value: "2" },
  { label: "High", value: "3" },
  { label: "Urgent", value: "4" },
  { label: "Critical", value: "5" },
];
export const TASKS_STATUS_OPTIONS = [
  { label: String("Not Started"), value: "1" },
  { label: String("Deferred"), value: "2" },
  { label: String("In Progress"), value: "3" },
  { label: String("Completed"), value: "4" },
  { label: String("Waiting for Input"), value: "5" },
];
/* 
all_tasks
my_tasks
favorite_tasks
due_today
due_this_week
overdue
related_to_deals
related_to_contacts
related_to_accounts
*/
export const TASKS_AVAILABLE_VIEWS = [
  {
    title: "Task Ownership",
    options: [
      { label: "All Tasks", value: "all_tasks", default: true },
      { label: "My Tasks", value: "my_tasks", default: true },
      { label: "Favorite Tasks", value: "favorite_tasks" },
    ],
  },
  {
    title: "Date-Based Smart Views",
    options: [
      { label: "Due Today", value: "due_today", default: true },
      { label: "Due This Week", value: "due_this_week", default: true },
      { label: "Overdue", value: "overdue" },
    ],
  },
  /*
  {
    title: "Task For Views",
    options: [
      { label: "Task For Leads", value: "task_for_leads" },
      { label: "Task For Contacts", value: "task_for_contacts" },
    ],
  },
  */
  {
    title: "Relation-Based Views",
    options: [
      { label: "Related to Deals", value: "related_to_deals" },
      { label: "Related to Accounts", value: "related_to_accounts" },
    ],
  },
];
export const TASKS_INITIAL_VIEWS = TASKS_AVAILABLE_VIEWS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
/*
subject
related_to
status_id
priority_id
due_date
reminder
owner_id
last_modified_by
create_date
last_activity
completion_date
*/
export const TASKS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Subject", value: "subject", default: true },
      { label: "Related To", value: "related_to" },
      { label: "Status", value: "status_id" },
      { label: "Priority", value: "priority_id" },
      { label: "Due Date", value: "due_date", default: true },
      { label: "Reminder", value: "reminder" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Task Owner", value: "owner_id", default: true },
      { label: "Last Modified By", value: "last_modified_by" },
    ],
  },
  {
    title: "Date & Tracking",
    options: [
      { label: "Create Date", value: "create_date" },
      { label: "Last Activity", value: "last_activity", default: true },
      { label: "Completion Date", value: "completion_date" },
    ],
  },
];
export const TASKS_INITIAL_FILTERS = TASKS_AVAILABLE_FILTERS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
// =====================================
//  TASKS CONSTANTS - Ending
// =====================================

// =====================================
//  DEALS CONSTANTS - Starting
// =====================================
export const DEALS_SOURCE_OPTIONS = [
  { label: "Advertisement", value: "1" },
  { label: "Cold Call", value: "2" },
  { label: "Employee Referral", value: "3" },
  { label: "External Referral", value: "4" },
  { label: "Online Store", value: "5" },
  { label: "Partner", value: "6" },
  { label: "Public Relations", value: "7" },
  { label: "Sales Email Alias", value: "8" },
  { label: "Seminar Partner", value: "9" },
  { label: "Internal Seminar", value: "10" },
  { label: "Trade Show", value: "11" },
  { label: "Web Download", value: "12" },
  { label: "Web Research", value: "13" },
  { label: "Chat", value: "14" },
];

export const DEALS_TYPES_OPTIONS = [
  { label: "Existing Business", value: "1" },
  { label: "New Business", value: "2" },
];
export const DEALS_STAGES_OPTIONS = [
  { label: "Qualification", value: "1" },
  { label: "Needs Analysis", value: "2" },
  { label: "Value Proposition", value: "3" },
  { label: "Identify Decision Makers", value: "4" },
  { label: "Proposal/Price Quote", value: "5" },
  { label: "Negotiation/Review", value: "6" },
  { label: "Closed Won", value: "7" },
  { label: "Closed Lost", value: "8" },
  { label: "Closed Lost to Competition", value: "9" },
];
export const DEALS_STATUS_OPTIONS = DEALS_STAGES_OPTIONS;

export const DEALS_AVAILABLE_VIEWS = [
  {
    title: "Deals Ownership",
    options: [
      { label: "All Deals", value: "all_deals", default: true },
      { label: "My Deals", value: "my_deals", default: true },
      { label: "Favorite Deals", value: "favorite_deals" },
    ],
  },
  /*
  {
    title: "Status-Based Views",
    options: [
      { label: "Qualification", value: "qualification" },
      { label: "Need Analysis", value: "need_analysis" },
      { label: "Value Proposition", value: "value_proposition" },
      { label: "Proposal / Price Quote", value: "proposal_price_quote" },
      { label: "Negotiation / Review", value: "negotiation_review" },
      { label: "Closed – Won", value: "closed_won" },
      { label: "Closed – Lost", value: "closed_lost" },
    ],
  },
  */
  {
    title: "Progress-Based Views",
    options: [
      { label: "No Recent Activity", value: "no_recent_activity" },
     // { label: "Recently Contacted", value: "recently_contacted" },
      { label: "Overdue Closing Date", value: "overdue_closing_date" },
    ],
  },
  {
    title: "Value & Probability Views",
    options: [
      {
        label: "High Probability Deals (>70%)",
        value: "probability_grater_70",
      },
      { label: "Low Probability Deals (<30%)", value: "probability_less_30" },
      {
        label: "High Value Deals",
        value: "high_value_deals",
      },
    ],
  },
];
export const DEALS_INITIAL_VIEWS = DEALS_AVAILABLE_VIEWS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
export const DEALS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Deal Name", value: "title", default: true },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Amount", value: "amount" },
      { label: "Probability (%)", value: "probability" },
      { label: "Expected Revenue", value: "expected_revenue" },
      { label: "Created Date", value: "created_date" },
      { label: "Closing Date", value: "closing_date" },
      { label: "Last Activity", value: "last_activity" },
      { label: "Deal Stage", value: "status_id" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Deal Owner", value: "owner_id", default: true },
      { label: "Contact Name", value: "contact_id" },
    ],
  },
  {
    title: "Qualification & Source",
    options: [
      { label: "Deal Source", value: "source_id", default: true },
      //{ label: "Campaign Source", value: "campaign_source_id" },
    ],
  },
];
export const DEALS_INITIAL_FILTERS = DEALS_AVAILABLE_FILTERS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
// =====================================
//  DEALS CONSTANTS - Ending
// =====================================

// =====================================
//  ACCOUNTS CONSTANTS - Starting
// =====================================
export const COMPANY_TYPES = [
  { label: "Analyst", value: "1" },
  { label: "Competitor", value: "2" },
  { label: "Customer", value: "3" },
  { label: "Distributor", value: "4" },
  { label: "Integrator", value: "5" },
  { label: "Investor", value: "6" },
  { label: "Other", value: "7" },
  { label: "Partner", value: "8" },
  { label: "Press", value: "9" },
  { label: "Prospect", value: "10" },
  { label: "Reseller", value: "11" },
  { label: "Supplier", value: "12" },
  { label: "Vendor", value: "13" },
];
/*
export const COMPANY_RATING = [
  { label: "Acquired", value: "1" },
  { label: "Active", value: "2" },
  { label: "Market Failed", value: "3" },
  { label: "Project Cancelled", value: "4" },
  { label: "Shut Down", value: "5" },
];
export const COMPANY_OWNERSHIP = [
  { label: "Other", value: "1" },
  { label: "Private", value: "2" },
  { label: "Public", value: "3" },
  { label: "Subsidiary", value: "4" },
  { label: "Partnership", value: "5" },
  { label: "Government", value: "6" },
  { label: "Privately Held", value: "7" },
  { label: "Public Company", value: "8" },
];
*/
export const ACCOUNTS_TYPES = [
  { label: "Acquired", value: "1" },
  { label: "Active", value: "2" },
  { label: "Market Failed", value: "3" },
  { label: "Project Cancelled", value: "4" },
  { label: "Shut Down", value: "5" },
];
export const ACCOUNTS_STATUS_OPTIONS = [
  { label: "New", value: "1" },
  { label: "Active Accounts", value: "2" },
  { label: "Inactive Accounts", value: "3" },
  { label: "Prospect", value: "4" },
  { label: "Closed - Won", value: "5" },
  { label: "Closed - Lost", value: "6" },
];
export const ACCOUNTS_AVAILABLE_VIEWS = [
  {
    title: "Accounts Ownership",
    options: [
      { label: "All Accounts", value: "all_accounts", default: true },
      { label: "My Accounts", value: "my_accounts", default: true },
      { label: "Favorite Accounts", value: "favorite_accounts" },

      { label: "Recently Added", value: "recently_added" },
      { label: "Active Account", value: "active_account" },
      { label: "Inactive Account", value: "inactive_account" },
    ],
  },
  {
    title: "Progress-Based Views",
    options: [
      { label: "No Recent Activity", value: "no_recent_activity" },
      //{ label: "Recently Contacted", value: "recently_contacted" },
    ],
  },
  {
    title: "Engagement Insights",
    options: [
      { label: "No Phone Provided", value: "no_phone_provided" },
      { label: "Email only Leads", value: "email_only_leads" },
      { label: "Website Added", value: "website_added" },
    ],
  },
];
export const ACCOUNTS_INITIAL_VIEWS = ACCOUNTS_AVAILABLE_VIEWS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
export const ACCOUNTS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Account Name", value: "title", default: true },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Mobile", value: "mobile" },
      { label: "Fax", value: "fax" },
      { label: "Website", value: "website" },
      { label: "Industry", value: "industry_id" },
      { label: "Account Type", value: "type_id" },
      { label: "Annual Revenue", value: "annual_revenue" },
      { label: "Employees", value: "employees" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Account Owner", value: "owner_id", default: true },
      // { label: "Assigned Team", value: "assigned_team" },
    ],
  },
  {
    title: "Status & Activity",
    options: [
      { label: "Account Status", value: "status_id" },
      { label: "Last Activity", value: "last_activity", default: true },
      { label: "Create Date", value: "create_date" },
    ],
  },
  /*
  {
    title: "Qualification & Source",
    options: [
      { label: "Contact Source", value: "contact_source" },
      { label: "Account Rating", value: "account_rating" },
    ],
  },
  {
    title: "Geographical Info",
    options: [
      { label: "Country", value: "country" },
      { label: "State/Region", value: "state_region" },
    ],
  },
  {
    title: "Relationship Filters",
    options: [
      { label: "Related Contacts", value: "related_contacts" },
      { label: "Related Deals", value: "related_deals" },
    ],
  },
  */
];
export const ACCOUNTS_INITIAL_FILTERS = ACCOUNTS_AVAILABLE_FILTERS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
// =====================================
//  ACCOUNTS CONSTANTS - Ending
// =====================================

// =====================================
//  CONTACTS CONSTANTS - Starting
// =====================================
export const CONTACTS_STATUS_OPTIONS = [
  { label: "New", value: "1" },
  { label: "Active Contact", value: "2" },
  { label: "Inactive Contact", value: "3" },
  { label: "Prospect", value: "4" },
  { label: "Closed - Won", value: "5" },
  { label: "Closed - Lost", value: "6" },
];
export const CONTACTS_TYPES = [
  { label: "Acquired", value: "1" },
  { label: "Active", value: "2" },
  { label: "Market Failed", value: "3" },
  { label: "Project Cancelled", value: "4" },
  { label: "Shut Down", value: "5" },
];
export const CONTACTS_SOURCES_OPTIONS = [
  { label: "Advertisement", value: "1" },
  { label: "Cold Call", value: "2" },
  { label: "Employee Referral", value: "3" },
  { label: "External Referral", value: "4" },
  { label: "Online Store", value: "5" },
  { label: "X (Twitter)", value: "6" },
  { label: "Facebook", value: "7" },
  { label: "Partner", value: "8" },
  { label: "Public Relations", value: "9" },
  { label: "Sales Email Alias", value: "10" },
  { label: "Seminar Partner", value: "11" },
  { label: "Internal Seminar", value: "12" },
  { label: "Trade Show", value: "13" },
  { label: "Web Download", value: "14" },
  { label: "Web Research", value: "15" },
  { label: "Chat", value: "16" },
];
export const CONTACTS_AVAILABLE_VIEWS = [
  {
    title: "Contact Ownership",
    options: [
      { label: "All Contacts", value: "all_contacts", default: true },
      { label: "My Contacts", value: "my_contacts", default: true },
      // { label: "Contact Status", value: "status_id" },
      {
        label: "Unassigned Contacts",
        value: "unassigned_contacts",
        default: true,
      },
      { label: "Favorite", value: "favorite_contacts" },
    ],
  },
  /*
  {
    title: "Status-Based Smart Views",
    options: [
      { label: "New", value: "new" },
      { label: "Active Contact", value: "active" },
      { label: "Inactive Contact", value: "inactive" },
      { label: "Prospect", value: "prospect" },
      { label: "Closed-Won", value: "closed_won" },
      { label: "Closed-Lost", value: "closed_lost" },
    ],
  },
  */
  {
    title: "Progress-Based Views",
    options: [
      { label: "No Recent Activity", value: "no_recent_activity" },
      {
        label: "Recently Contacted",
        value: "recently_contacted",
        default: true,
      },
    ],
  },
  {
    title: "Engagement Insights",
    options: [
      { label: "No Phone Provided", value: "no_phone_provided" },
      { label: "Email only Contacts", value: "email_only" },
    ],
  },
];
export const CONTACTS_INITIAL_VIEWS = CONTACTS_AVAILABLE_VIEWS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
export const CONTACTS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Contact Name", value: "title", default: true },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Mobile", value: "mobile" },
      { label: "Fax", value: "fax" },
      { label: "Website", value: "website" },
      { label: "Create Date", value: "created_on" },
      { label: "Last Activity", value: "last_activity", default: true },
      { label: "Contact Status", value: "status_id" },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Contact Owner", value: "owner_id", default: true },
      { label: "Account Name", value: "account_id", default: true },
    ],
  },
  {
    title: "Qualification & Source",
    options: [
      { label: "Contact Role", value: "role_id" },
      { label: "Contact Source", value: "source_id" },
    ],
  },
  {
    title: "Geographical & Address Details",
    options: [
      { label: "Country", value: "country_id" },
      { label: "State", value: "state_id" },
      { label: "Postal Code", value: "postal_code" },
    ],
  },
];
export const CONTACTS_INITIAL_FILTERS = CONTACTS_AVAILABLE_FILTERS.flatMap(
  (group) => group.options.filter((opt) => opt.default)
);
// =====================================
//  CONTACTS CONSTANTS - Ending
// =====================================

// =====================================
//  LEADS CONSTANTS - Starting
// =====================================
export const LEADS_STATUS_OPTIONS = [
  { label: "New Lead", value: "1" },
  { label: "Contacted", value: "2" },
  { label: "Qualified", value: "3" },
  { label: "In Progress", value: "4" },
  { label: "Negotiation", value: "5" },
  { label: "Closed - Won", value: "6" },
  { label: "Closed - Lost", value: "7" },
];
export const LEADS_TYPES = [
  { label: "Acquired", value: "1" },
  { label: "Active", value: "2" },
  { label: "Market Failed", value: "3" },
  { label: "Project Cancelled", value: "4" },
  { label: "Shut Down", value: "5" },
];
export const LEADS_ROLES_OPTIONS = [
  { label: "Role 1", value: "1" },
  { label: "Role 2", value: "2" },
];
export const LEADS_SOURCES_OPTIONS = [
  { label: "Advertisement", value: "1" },
  { label: "Cold Call", value: "2" },
  { label: "Employee Referral", value: "3" },
  { label: "External Referral", value: "4" },
  { label: "Online Store", value: "5" },
  { label: "X (Twitter)", value: "6" },
  { label: "Facebook", value: "7" },
  { label: "Partner", value: "8" },
  { label: "Public Relations", value: "9" },
  { label: "Sales Email Alias", value: "10" },
  { label: "Seminar Partner", value: "11" },
  { label: "Internal Seminar", value: "12" },
  { label: "Trade Show", value: "13" },
  { label: "Web Download", value: "14" },
  { label: "Web Research", value: "15" },
  { label: "Chat", value: "16" },
];
export const LEADS_AVAILABLE_VIEWS = [
  {
    title: "Lead Ownership",
    options: [
      { label: "All Leads", value: "all_leads", default: true },
      { label: "My Leads", value: "my_leads", default: true },
      // { label: "Lead Status", value: "lead_status" },
      { label: "Unassigned Lead", value: "unassigned_lead", default: true },
      { label: "Favorite Lead", value: "favorite_lead" },
    ],
  },
  /*
  {
    title: "Status-Based Smart Views",
    options: [
      { label: "New", value: "new" },
      { label: "Contacted", value: "contacted" },
      { label: "Qualified", value: "qualified" },
      { label: "Proposal Sent", value: "proposal_sent" },
      { label: "Negotiation", value: "negotiation" },
      { label: "Converted", value: "converted" },
      { label: "Lost", value: "lost" },
      { label: "Follow-up", value: "follow_up", default: true },

      { label: "New Lead", value: "new_lead" },
      { label: "Contacted", value: "contacted" },
      { label: "Qualified", value: "qualified" },
      { label: "In Progress", value: "in_progress" },
      { label: "Negotiation", value: "negotiation" },
      { label: "Closed - Won", value: "closed_won" },
      { label: "Closed - Lost", value: "closed_lost" },
    ],
  },
  */
  {
    title: "Progress-Based Views",
    options: [
      { label: "In Progress", value: "in_progress", default: true },
      { label: "No Recent Activity", value: "no_recent_activity" },
      { label: "Recently Contacted", value: "recently_contacted" },
    ],
  },
  {
    title: "Engagement Insights",
    options: [
      { label: "No Phone Provided", value: "no_phone_provided" },
      { label: "Email Only Leads", value: "email_only_leads" },
      { label: "Website Added", value: "website_added" },
    ],
  },
];
export const LEADS_INITIAL_VIEWS = LEADS_AVAILABLE_VIEWS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
export const LEADS_AVAILABLE_FILTERS = [
  {
    title: "Basic Info",
    options: [
      { label: "Lead Name", value: "title", default: true },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Mobile", value: "mobile" },
      { label: "Fax", value: "fax" },
      { label: "Website", value: "website" },
      { label: "Create Date", value: "created_on" },
      { label: "Last Activity", value: "last_activity", default: true },
    ],
  },
  {
    title: "Assignment & Ownership",
    options: [
      { label: "Lead Owner", value: "owner_id", default: true },
      { label: "Account Name", value: "account_id", default: true },
    ],
  },
  {
    title: "Qualification & Source",
    options: [
      { label: "Lead Status", value: "status_id" },
      { label: "Lead Source", value: "source_id" },
      { label: "Lead Role", value: "role_id" },
    ],
  },
  {
    title: "Geographical & Address Details",
    options: [
      { label: "Country", value: "country_id" },
      { label: "State", value: "state_id" },
      { label: "Postal Code", value: "postal_code" },
    ],
  },
];
export const LEADS_INITIAL_FILTERS = LEADS_AVAILABLE_FILTERS.flatMap((group) =>
  group.options.filter((opt) => opt.default)
);
// =====================================
//  LEADS CONSTANTS - Ending
// =====================================

// =====================================
//  COMMON FILTERS - Starting
// =====================================
// filterFieldsConfig.js
export const FILTER_FIELDS_CONFIG = {
  name: { label: "Name", type: "text" },
  title: { label: "Name", type: "text" },
  email: { label: "Email", type: "text" },
  phone: { label: "Phone", type: "text" },
  mobile: { label: "Mobile", type: "text" },
  fax: { label: "Fax", type: "text" },
  website: { label: "Website", type: "text" },
  postal_code: { label: "Postal Code", type: "text" },
  //related_to: { label: "Related To", type: "text" },

  related_to: {
    label: "Related To",
    type: "dropdown",
    options: RELATED_TO_OPTIONS,
  },  

  venue: { label: "Venue", type: "text" },
  location: { label: "Location", type: "text" },
  subject: { label: "Subject", type: "text" },
  amount: { label: "Amount", type: "number" },
  probability: { label: "Probability (%)", type: "number" },
  expected_revenue: { label: "Expected Revenue", type: "number" },
  annual_revenue: { label: "Annual Revenue", type: "number" },
  employees: { label: "Employees", type: "number" },
  duration: { label: "Call Duration", type: "number" },

  // Dropdowns
  owner_id: { label: "Owner", type: "dropdown", source: "users" },
  assigned_to_id: {
    label: "Assigned To Team",
    type: "dropdown",
    source: "users",
  },
  account_id: { label: "Account Name", type: "dropdown", source: "users" },
  industry_id: { label: "Industry", type: "dropdown", options: INDUSTRIES },
  type_id: { label: "Type", type: "dropdown", options: COMPANY_TYPES },
  status_id: {
    label: "Status",
    type: "dropdown",
    options: MEETINGS_STATUS_OPTIONS,
  },
  status_id: {
    label: "Deal Stage",
    type: "dropdown",
    options: DEALS_STAGES_OPTIONS,
  },
  priority_id: {
    label: "Priority",
    type: "dropdown",
    options: TASKS_PRIORITIES_OPTIONS,
  },
  source_id: {
    label: "Lead Source",
    type: "dropdown",
    options: LEADS_SOURCES_OPTIONS,
  },
  role_id: {
    label: "Lead Role",
    type: "dropdown",
    options: LEADS_ROLES_OPTIONS,
  },
  country_id: { label: "Country", type: "dropdown", options: [] },
  state_id: { label: "State", type: "dropdown", options: [] },
  last_activity: {
    label: "Last Activity",
    type: "dropdown",
    options: LAST_ACTIVITY,
  },

  // Dates
  create_date: { label: "Create Date", type: "date" },
  created_date: { label: "Create Date", type: "date" },
  created_on: { label: "Create Date", type: "date" },
  due_date: { label: "Due Date", type: "date" },
  reminder: { label: "Reminder", type: "date" },
  completion_date: { label: "Completion Date", type: "date" },
  closing_date: { label: "Closing Date", type: "date" },

  // DateTimes
  start_time: { label: "Start Time", type: "datetime" },
  end_time: { label: "End Time", type: "datetime" },
};
export const MODULE_FILTERS_CONFIG = {
  accounts: {
    filters: [
      "title",
      "email",
      "phone",
      "mobile",
      "industry_id",
      "type_id",
      "owner_id",
      "create_date",
    ],
    useFiltersStore: () =>
      import("@/stores/crm/useAccountsStore").then(
        (m) => m.useAccountsFiltersStore
      ),
    useMainStore: () =>
      import("@/stores/crm/useAccountsStore").then((m) => m.default),
    availableFilters: "ACCOUNTS_AVAILABLE_FILTERS",
    initialFilters: "ACCOUNTS_INITIAL_FILTERS",
  },

  calls: {
    filters: [
      "subject",
      "start_time",
      "duration",
      "owner_id",
      "assigned_to_id",
    ],
    useFiltersStore: () =>
      import("@/stores/crm/useCallsStore").then((m) => m.useCallsFiltersStore),
    useMainStore: () =>
      import("@/stores/crm/useCallsStore").then((m) => m.default),
    availableFilters: "CALLS_AVAILABLE_FILTERS",
    initialFilters: "CALLS_INITIAL_FILTERS",
  },
};

// =====================================
//  COMMON FILTERS - Ending
// =====================================
