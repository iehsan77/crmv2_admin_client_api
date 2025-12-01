import { API_DOMAIN } from "@/constants/general_constants";


/*
admin@businessesify.com
asdASD123
*/





const AUTH = "auth";
export const auth_endpoints = {
  auth: {
    login: `${API_DOMAIN}/${AUTH}/tenant-login`,
    logout: `${API_DOMAIN}/${AUTH}/tenant-logout`,
    register:{
      step1: `${API_DOMAIN}/${AUTH}/tenant-signup`,
      step2: `${API_DOMAIN}/${AUTH}/tenant-verify`,
      step3: `${API_DOMAIN}/${AUTH}/tenant-company-info`,
      step4: `${API_DOMAIN}/${AUTH}/tenant-domain-info`,
      step5: `${API_DOMAIN}/${AUTH}/tenant-modules`,
    }
  }
};
