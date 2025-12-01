import { API_DOMAIN } from "@/constants/general_constants";

/*
admin@businessesify.com
asdASD123
*/
const SETTINGS = "crm_settings";

export const crm_endpoints = {
  dashboard: {
    get: `${API_DOMAIN}/stats`,
  },
  permissions: {
    get: `${API_DOMAIN}/permissions/get-all`,
  },
  apps: {
    get: `${API_DOMAIN}/apps/get`,
    getWithModules: `${API_DOMAIN}/apps/get-with-modules`,
    save: `${API_DOMAIN}/apps/save`,
    delete: (id) => `${API_DOMAIN}/apps/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/apps/${id}/deleted/0`,
  },

  // LEADS - starting
  layouts: {
    get: `${API_DOMAIN}/layouts/get`,
    getByModule: `${API_DOMAIN}/layouts/get-by-module-id`,
    getById: (id) => `${API_DOMAIN}/layouts/get/${id}`,
    save: `${API_DOMAIN}/layouts/save`,
    saveDefaultForm: `${API_DOMAIN}/layouts/form/save`,
    delete: (id) => `${API_DOMAIN}/layouts/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/layouts/${id}/deleted/0`,
  },
  formBuilderFields: {
    get: `${API_DOMAIN}/form-builder/fields/get`,
    save: `${API_DOMAIN}/form-builder/fields/save`,
    delete: (id) => `${API_DOMAIN}/form-builder/fields/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/form-builder/fields/${id}/deleted/0`,
    withAttributes: `${API_DOMAIN}/form-builder/fields-with-attributes`,
  },
  attachments: {
    get: `${API_DOMAIN}/attachments/get`,
    save: `${API_DOMAIN}/attachments/save`,
    delete: (id) => `${API_DOMAIN}/attachments/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/attachments/${id}/deleted/0`,
  },
  notes: {
    get: `${API_DOMAIN}/notes/get`,
    save: `${API_DOMAIN}/notes/save`,
    delete: (id) => `${API_DOMAIN}/notes/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/notes/${id}/deleted/0`,
  },
  crm: {
    leads: {
      getStatistics: `${API_DOMAIN}/crm/leads/get-statistics`, //
      getSummaryChartData: `${API_DOMAIN}/crm/leads/get-lead-summary-chart-data`,
      getStatusChartData: `${API_DOMAIN}/crm/leads/get-lead-status-chart-data`,

      get: `${API_DOMAIN}/crm/leads/get`,
      save: `${API_DOMAIN}/crm/leads/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/leads/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/leads/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/leads/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/leads/${id}/favorite/${v}`, //
      getByStatus: `${API_DOMAIN}/crm/leads/get-grouped-by-status`, //
      updateStatus: `${API_DOMAIN}/crm/leads/update-status`, //

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/leads/get-by-view-ukey/${id}`,
      clone: (id) => `${API_DOMAIN}/leads/clone/${id}`,
      // ONHOLD - ending
    },
    contacts: {
      getStatistics: `${API_DOMAIN}/crm/contacts/get-statistics`,
      getSummaryChartData: `${API_DOMAIN}/crm/contacts/get-summary-chart-data`, //
      getStatusChartData: `${API_DOMAIN}/crm/contacts/get-status-chart-data`,

      get: `${API_DOMAIN}/crm/contacts/get`,
      save: `${API_DOMAIN}/crm/contacts/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/contacts/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/contacts/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/contacts/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/contacts/${id}/favorite/${v}`, //
      getByStatus: `${API_DOMAIN}/crm/contacts/get-grouped-by-status`, //
      updateStatus: `${API_DOMAIN}/crm/contacts/update-status`, //

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/contacts/get-by-view-ukey/${id}`,
      clone: (id) => `${API_DOMAIN}/contacts/clone/${id}`,
      // ONHOLD - ending
    },
    accounts: {
      getStatistics: `${API_DOMAIN}/crm/accounts/get-statistics`,
      getAccountSummaryChartData: `${API_DOMAIN}/crm/accounts/get-account-summary-chart-data`,
      getAccountStatusChartData: `${API_DOMAIN}/crm/accounts/get-account-status-chart-data`,

      get: `${API_DOMAIN}/crm/accounts/get`,
      save: `${API_DOMAIN}/crm/accounts/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/accounts/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/accounts/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/accounts/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/accounts/${id}/favorite/${v}`,
      getByStatus: `${API_DOMAIN}/crm/accounts/get-grouped-by-status`,
      updateStatus: `${API_DOMAIN}/crm/accounts/update-status`,

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/accounts/get-by-view-ukey/${id}`,
      getById: (id) => `${API_DOMAIN}/accounts/get/${id}`,
      clone: (id) => `${API_DOMAIN}/accounts/clone/${id}`,
      // ONHOLD - ending
    },
    deals: {
      getStatistics: `${API_DOMAIN}/crm/deals/get-statistics`, //
      getDealsSummaryChartData: `${API_DOMAIN}/crm/deals/get-deal-summary-chart-data`,
      getDealsStatusChartData: `${API_DOMAIN}/crm/deals/get-deal-status-chart-data`,

      get: `${API_DOMAIN}/crm/deals/get`,
      save: `${API_DOMAIN}/crm/deals/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/deals/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/deals/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/deals/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/deals/${id}/favorite/${v}`, //
      getByStatus: `${API_DOMAIN}/crm/deals/get-grouped-by-status`, //
      updateStatus: `${API_DOMAIN}/crm/deals/update-status`, //

      // ONHOLD - satrting
      getById: (id) => `${API_DOMAIN}/deals/get/${id}`,
      clone: (id) => `${API_DOMAIN}/deals/clone/${id}`,

      stages: {
        get: `${API_DOMAIN}/deals/stages/get`,
        getRecord: (id) => `${API_DOMAIN}/deals/stages/get/${id}`,
        save: `${API_DOMAIN}/deals/stages/save`,
        delete: (id) => `${API_DOMAIN}/deals/stages/${id}/deleted/1`,
        restore: (id) => `${API_DOMAIN}/deals/stages/${id}/deleted/0`,
      },
      // ONHOLD - ending
    },
    custom_views: {
      get: `${API_DOMAIN}/custom/views/get`,
      getByModelId: (id) => `${API_DOMAIN}/custom/views/get-by-module-id/${id}`,
      setDefault: (id) => `${API_DOMAIN}/custom/views/set-default/${id}`,
      save: `${API_DOMAIN}/custom/views/save`,
      delete: (id) => `${API_DOMAIN}/custom/views/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/custom/views/${id}/deleted/0`,
    },
    listing_views: {
      get: `${API_DOMAIN}/listings/views/get`,
      setDefault: (id) => `${API_DOMAIN}/listings/views/set-default/${id}`,
      save: `${API_DOMAIN}/listings/views/save`,
      delete: (id) => `${API_DOMAIN}/listings/views/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/listings/views/${id}/deleted/0`,
    },
    calls: {
      getStatistics: `${API_DOMAIN}/crm/calls/get-statistics`,
      get: `${API_DOMAIN}/crm/calls/get`,
      save: `${API_DOMAIN}/crm/calls/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/calls/details/get/${id}`,
      getRelatedCalls: (module, id) =>
        `${API_DOMAIN}/crm/calls/get-related-calls/${module}/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/calls/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/calls/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/calls/${id}/favorite/${v}`,
      getByStatus: `${API_DOMAIN}/crm/calls/get-grouped-by-status`,
      updateStatus: `${API_DOMAIN}/crm/calls/update-status`,

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/calls/get-by-view-ukey/${id}`,
      updatePurpose: `${API_DOMAIN}/calls/update-purpose`,
      clone: (id) => `${API_DOMAIN}/calls/clone/${id}`,
      bulkUpdate: `${API_DOMAIN}/calls/bulk-update`,
      bulkDelete: `${API_DOMAIN}/calls/bulk-delete`,
      // ONHOLD - ending
    },
    meetings: {
      getStatistics: `${API_DOMAIN}/crm/meetings/get-statistics`,
      get: `${API_DOMAIN}/crm/meetings/get`,
      save: `${API_DOMAIN}/crm/meetings/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/meetings/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/meetings/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/meetings/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/meetings/${id}/favorite/${v}`,
      getByStatus: `${API_DOMAIN}/crm/meetings/get-grouped-by-status`,
      updateStatus: `${API_DOMAIN}/crm/meetings/update-status`,

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/meetings/get-by-view-ukey/${id}`,
      getByVenue: `${API_DOMAIN}/meetings/get-grouped-by-venue`,
      updateVenue: `${API_DOMAIN}/meetings/update-venue`,
      clone: (id) => `${API_DOMAIN}/meetings/clone/${id}`,
      bulkUpdate: `${API_DOMAIN}/meetings/bulk-update`,
      bulkDelete: () => `${API_DOMAIN}/meetings/bulk-delete`,
      // ONHOLD - ending
    },
    tasks: {
      getStatistics: `${API_DOMAIN}/crm/tasks/get-statistics`,
      get: `${API_DOMAIN}/crm/tasks/get`,
      save: `${API_DOMAIN}/crm/tasks/save`,
      getDetails: (id) => `${API_DOMAIN}/crm/tasks/details/get/${id}`,
      delete: (id) => `${API_DOMAIN}/crm/tasks/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/tasks/${id}/deleted/0`,
      favorite: (id, v) => `${API_DOMAIN}/crm/tasks/${id}/favorite/${v}`,
      getByStatus: `${API_DOMAIN}/crm/tasks/get-grouped-by-status`,
      updateStatus: `${API_DOMAIN}/crm/tasks/update-status`,

      // ONHOLD - satrting
      getByCustomViwByUkey: (id) =>
        `${API_DOMAIN}/tasks/get-by-view-ukey/${id}`,
      updatePriority: `${API_DOMAIN}/tasks/update-priority`,
      clone: (id) => `${API_DOMAIN}/tasks/clone/${id}`,
      bulkUpdate: `${API_DOMAIN}/tasks/bulk-update`,
      bulkDelete: () => `${API_DOMAIN}/tasks/bulk-delete`,
      // ONHOLD - ending
    },
    associations: {
      get: `${API_DOMAIN}/crm/associations/get`,
      save: `${API_DOMAIN}/crm/associations/save`,
      delete: (id) => `${API_DOMAIN}/crm/associations/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/crm/associations/${id}/deleted/0`,
      attachments: {
        get: `${API_DOMAIN}/crm/associations/attachments/get`,
        save: `${API_DOMAIN}/crm/associations/attachments/save`,
        delete: (id) => `${API_DOMAIN}/attachments/${id}/deleted/1`,
        restore: (id) => `${API_DOMAIN}/attachments/${id}/deleted/0`,
      },
    },
  },

  // SETTINGS - manual definition starts
  settings: {
    departments: {
      get: `${API_DOMAIN}/${SETTINGS}/departments/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/departments/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/departments/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/departments/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/departments/${id}/deleted/0`,
    },
    designations: {
      get: `${API_DOMAIN}/${SETTINGS}/designations/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/designations/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/designations/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/designations/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/designations/${id}/deleted/0`,
    },
    industries: {
      get: `${API_DOMAIN}/${SETTINGS}/industries/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/industries/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/industries/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/industries/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/industries/${id}/deleted/0`,
    },
    integrations: {
      sms: {
        get: `${API_DOMAIN}/${SETTINGS}/integrations/sms/get`,
        getRecord: (id) =>
          `${API_DOMAIN}/${SETTINGS}/integrations/sms/get/${id}`,
        save: `${API_DOMAIN}/${SETTINGS}/integrations/sms/save`,
        delete: (id) =>
          `${API_DOMAIN}/${SETTINGS}/integrations/sms/${id}/deleted/1`,
        restore: (id) =>
          `${API_DOMAIN}/${SETTINGS}/integrations/sms/${id}/deleted/0`,
      },
      whatsapp: {
        save: `${API_DOMAIN}/${SETTINGS}/integrations/whatsapp/save`,
        get: `${API_DOMAIN}/${SETTINGS}/integrations/whatsapp/get`,
      },
    },
    roles: {
      get: `${API_DOMAIN}/${SETTINGS}/roles/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/roles/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/roles/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/roles/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/roles/${id}/deleted/0`,
      reassignAndDelete: (to_delete, to_report_to) =>
        `${API_DOMAIN}/${SETTINGS}/roles/reassign_delete_role/${to_delete}/${to_report_to}`, // <-- new manual endpoint
    },
    profiles: {
      get: `${API_DOMAIN}/${SETTINGS}/profiles/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/profiles/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/profiles/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/profiles/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/profiles/${id}/deleted/0`,
    },
    "system-users": {
      //get: `${API_DOMAIN}/${SETTINGS}/users/get`,
      get: `${API_DOMAIN}/${SETTINGS}/users/get-by-tenant`,
      getByTenant: `${API_DOMAIN}/${SETTINGS}/users/get-by-tenant`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/users/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/users/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/users/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/users/${id}/deleted/0`,
    },
    companies: {
      get: `${API_DOMAIN}/${SETTINGS}/companies/get`,
      getRecord: (id) => `${API_DOMAIN}/${SETTINGS}/companies/get/${id}`,
      save: `${API_DOMAIN}/${SETTINGS}/companies/save`,
      delete: (id) => `${API_DOMAIN}/${SETTINGS}/companies/${id}/deleted/1`,
      restore: (id) => `${API_DOMAIN}/${SETTINGS}/companies/${id}/deleted/0`,
    },
  },
  // SETTINGS - manual definition ends

  // Permissions CRUD on Particular Profile
  profile_permissions: {
    save: `${API_DOMAIN}/permissions/profile/save`,
    get: (id) => `${API_DOMAIN}/permissions/profile/${id}`,
  },

  loginLog: {
    get: `${API_DOMAIN}/auth/user-login-history`,
  },
};
