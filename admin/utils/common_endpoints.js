import { API_DOMAIN } from "@/constants/general_constants";

export const common_endpoints = {
  getCountries: `${API_DOMAIN}/countries/get`,
  getCities: `${API_DOMAIN}/cities/get`,
  attachments: {
    get: `${API_DOMAIN}/crm/associations/attachments/get`,
    save: `${API_DOMAIN}/crm/associations/attachments/save`,
    delete: (id) => `${API_DOMAIN}/attachments/${id}/deleted/1`,
    restore: (id) => `${API_DOMAIN}/attachments/${id}/deleted/0`,
  },
};
