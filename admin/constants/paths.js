export const ADMIN_PATHS = {
  DASHBOARD: "/dashboard",

  // SUPER ADMIN PATHS NEED TO DELETE - starting
  APPS: "/apps",
  APPS_ADD: "/apps/add",
  APPS_EDIT: (id) => `/apps/edit/${id}`,

  MODULES: "/modules",
  LAYOUTS: "/layouts",
  CUSTOMERS: "/customers",
  // SUPER ADMIN PATHS NEED TO DELETE - ending

  FORM_BUILDER: "/form-builder",
  CRM: {
    ROOT: "/crm",
    LEADS: {
      ADD: "/crm/leads/add",
      LIST: "/crm/leads",
      LIST_VIEW: (id) => `/crm/leads/custom-view/${id}`,
      VIEW: (id) => `/crm/leads/view/${id}`,
      EDIT: (id) => `/crm/leads/edit/${id}`,
    },
    CONTACTS: {
      ADD: "/crm/contacts/add",
      LIST: "/crm/contacts",
      LIST_VIEW: (id) => `/crm/contacts/custom-view/${id}`,
      VIEW: (id) => `/crm/contacts/view/${id}`,
      EDIT: (id) => `/crm/contacts/edit/${id}`,
    },
    ACCOUNTS: {
      ADD: "/crm/accounts/add",
      LIST: "/crm/accounts",
      LIST_VIEW: (id) => `/crm/accounts/custom-view/${id}`,
      VIEW: (id) => `/crm/accounts/view/${id}`,
      EDIT: (id) => `/crm/accounts/edit/${id}`,
    },
    DEALS: {
      ADD: "/crm/deals/add",
      LIST: "/crm/deals",
      VIEW: "/crm/deals/view",
      LIST_VIEW: (id) => `/crm/deals/custom-view/${id}`,
      EDIT: (id) => `/crm/deals/edit/${id}`,
    },
    TASKS: {
      ADD: "/crm/tasks/add",
      LIST: "/crm/tasks",
      LIST_VIEW: (id) => `/crm/tasks/custom-view/${id}`,
      VIEW: (id) => `/crm/tasks/view/${id}`,
      EDIT: (id) => `/crm/tasks/edit/${id}`,
    },
    MEETINGS: {
      ADD: "/crm/meetings/add",
      LIST: "/crm/meetings",
      LIST_VIEW: (id) => `/crm/meetings/custom-view/${id}`,
      VIEW: (id) => `/crm/meetings/view/${id}`,
      EDIT: (id) => `/crm/meetings/edit/${id}`,
    },
    CALLS: {
      ADD: "/crm/calls/add",
      LIST: "/crm/calls",
      LIST_VIEW: (id) => `/crm/calls/custom-view/${id}`,
      VIEW: (id) => `/crm/calls/view/${id}`,
      EDIT: (id) => `/crm/calls/edit/${id}`,
    },
  },

  FINANCE: {
    ROOT: "/finance",
    QUOTES: {
      LIST: `/finance/quotes`,
      ADD: `/finance/quotes/add`,
      EDIT: (id) => `/finance/quotes/edit/${id}`,
      VIEW: (id) => `/finance/quotes/view/${id}`,
    },
    INVOICES: {
      LIST: `/finance/invoices`,
      ADD: `/finance/invoices/add`,
      EDIT: (id) => `/finance/invoices/edit/${id}`,
      VIEW: (id) => `/finance/invoices/view/${id}`,
    },
  },

  BANNER: {
    ROOT: "/banner",
    SINGLE: {
      UPDATE: (id) => `/banner/update-singel-banner/${id}`,
    },
    MULTIPLE: {
      ADD: `/banner/update-multi-banner`,
      UPDATE: (id) => `/banner/update-multi-banner/${id}`,
    },
  },

  ECOMMERCE: {
    ROOT: "/ecommerce",
    ORDERS: {
      ADD: "/ecommerce/orders/add",
      LIST: "/ecommerce/orders",
    },
  },

  RENTIFY: {
    ROOT: "/rentify",
    OVERVIEW: "/rentify/overview",
    BRANDS: "/rentify/brands",
    MODELS: "/rentify/models",
    VEHICLES: {
      VIEW: (id) => `/rentify/vehicles/view/${id}`,
    },
    AFFILIATES: {
      ROOT: "/affiliates",
      OVERVIEW: "/affiliates/overview",
      VIEW: (id) => `/affiliates/view/${id}`,
    },
    BOOKINGS: {
      ROOT: "/bookings",
      OVERVIEW: "/bookings/overview",
      CUSTOMER: {
        VIEW: (id) => `/bookings/customer/${id}`
      }
    },
  },

  PROFILE_VIEW: (id) => `/settings/security/profiles/${id}`,

  SETTINGS: {
    PREFERENCES: {
      SYSTEM: "/settings/preferences/system",
      NOTIFICATIONS: "/settings/preferences/notifications",
    },
    GENERAL: {
      BUSINESSESIFY_ACCOUNT: "/settings/general/businessesify-account",
      DEPARTMENTS: "/settings/general/departments",
      DESIGNATIONS: "/settings/general/designations",
      INDUSTRIES: "/settings/general/industries",
      SYSTEM_USERS: "/settings/general/system-users",
      COMPANIES: "/settings/general/companies",
    },
    SECURITY: {
      ROLES: "/settings/security/roles",
      PROFILES: "/settings/security/profiles",
      LOGIN_HISTORY: "/settings/security/login-history",
    },
    CUSTOMIZATIONS: {
      DEAL_STAGES: "/settings/customizations/deal-stages",
      PIPELINES: "/settings/customizations/pipelines",
    },
    AUTOMATIONS: {
      WORKFLOW_RULES: "/settings/automations/workflow-rules",
      ACTIONS: "/settings/automations/actions",
      SCORING_RULES: "/settings/automations/scoring-rules",
    },
    THIRD_PARTY_INTEGRATIONS: {
      SMS: "/settings/integrations/sms",
      WHATSAPP: "/settings/integrations/whatsapp",
    },
    DATA_CENTER: {
      IMPORT: "/settings/data-center/import",
      EXPORT: "/settings/data-center/export",
      DB_BACKUP: "/settings/data-center/db-backup",
    },
  },
};

export const PUBLIC_PATHS = {
  ROOT: "/",
  LOGIN: "/login",
};
