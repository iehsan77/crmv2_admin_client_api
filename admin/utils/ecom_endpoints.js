const API_DOMAIN = "http://164.92.102.85:8013";
// const API_DOMAIN = "http://192.168.1.230:8013";
const ECOM_API_DOMAIN = API_DOMAIN + "/commerce";
export const DEMO_DOMAIN = "https://crmdevapi.cloudapiserver.com";

export const ecom_endpoints = {
  auth: {
    //verifyEmail: `${ECOM_API_DOMAIN}/auth/accout_verfication`,
    //forgotPassword: `${ECOM_API_DOMAIN}/auth/forgotpassword`,
    //updatePassword: `${ECOM_API_DOMAIN}/auth/updatepassword`,
    login: `${API_DOMAIN}/auth/sadmin_user`,
  },
  BANNER: {
    ADD_SINGLE_BANNER: `${API_DOMAIN}/banner/add_banner`,
    GET_SINGLE_BANNER: () =>`${API_DOMAIN}/banner/get_banners`,
    // GET_SINGLE_BANNER: `${API_DOMAIN}/banner/get_banners`,
    UPDATE_SINGLE_BANNER: (id) => `${API_DOMAIN}/banner/get_banner/${id}`,
    ADD_MULTI_BANNER: `${API_DOMAIN}/banner/update_carousels`,
    GET_MULTI_BANNER: () =>`${API_DOMAIN}/banner/get_carousels/`,
    // GET_MULTI_BANNER: `${API_DOMAIN}/banner/get_carousels`,
    UPDATE_MULTI_BANNER: (id) =>
      `${API_DOMAIN}/banner/get_carousel_image/${id}`,
  },

  products: {
    brands: {
      create: ECOM_API_DOMAIN + "/add_product_brands",
      list: ECOM_API_DOMAIN + "/get_product_brands",
      getRecord: (id) => `${ECOM_API_DOMAIN}/get_product_brand/${id}`,
      deleteRecord: (id) =>`${ECOM_API_DOMAIN}/delete_product_brand/${id}/1`,
      reStoreRecord: (id) =>`${ECOM_API_DOMAIN}/delete_product_brand/${id}/0`,
    },
    tags: {
      create: ECOM_API_DOMAIN + "/add_product_tag",
      list: ECOM_API_DOMAIN + "/get_product_tags",
      getRecord: (id) =>`${ECOM_API_DOMAIN}/get_product_tag/${id}`,
      deleteRecord: (id) =>`${ECOM_API_DOMAIN}/delete_product_tag/${id}/1`,
      reStoreRecord: (id) =>`${ECOM_API_DOMAIN}/delete_product_tag/${id}/0`,
    },
    warehouses: {
      create: ECOM_API_DOMAIN + "/add_product_warehouse",
      list: ECOM_API_DOMAIN + "/get_product_warehouses",
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product_warehouse/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_warehouse/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_warehouse/${id}/0`,
    },
    categories: {
      create: ECOM_API_DOMAIN + "/add_product_category",
      list: ECOM_API_DOMAIN + "/get_product_categories",
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product_category/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_category/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_category/${id}/0`,
    },
    attributes: {
      create: ECOM_API_DOMAIN + "/add_product_attribute",
      list: ECOM_API_DOMAIN + "/get_product_attribute",
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product_attribute/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_attribute/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_attribute/${id}/0`,
      getAttributeWithValues: () =>
        `${ECOM_API_DOMAIN}/get_attribute_with_values`,
    },
    attributeValues: {
      create: ECOM_API_DOMAIN + "/add_product_attribute_value",
      list: ECOM_API_DOMAIN + "/get_product_attribute_value",
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product_attribute_value/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_attribute_value/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_attribute_value/${id}/0`,
    },
    variations: {
      create: ECOM_API_DOMAIN + "/add_product_varient",
      //list: ECOM_API_DOMAIN + "/get_product_varients",
      getRecords: (product_id, ) =>
        `${ECOM_API_DOMAIN}/get_product_varients/${product_id}`,
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product_varient/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_varients/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product_varients/${id}/0`,
    },
    catalog: {
      create: ECOM_API_DOMAIN + "/add_product",
      list: ECOM_API_DOMAIN + "/get_products",
      getRecord: (id) =>
        `${ECOM_API_DOMAIN}/get_product/${id}`,
      deleteRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product/${id}/1`,
      reStoreRecord: (id) =>
        `${ECOM_API_DOMAIN}/delete_product/${id}/0`,
    },
    gallery: {
      create: ECOM_API_DOMAIN + "/add_product_gallery",
      list: ECOM_API_DOMAIN + "/get_product_gallery",
      //getRecord: (id) => `${ECOM_API_DOMAIN}/get_product/${id}`,
      deleteImage: ECOM_API_DOMAIN + "/delete_product_gallery",
    },
    quotes: {
      create: ECOM_API_DOMAIN + "/add_quotation",
      //list: ECOM_API_DOMAIN + "/get_product_quotes",
      getRecords: () =>
        `${ECOM_API_DOMAIN}/get_all_quotation`,
      getRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/get_quotation_by_id/${id}`,
      deleteRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_quotation/${id}`,
      reStoreRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_quotation/${id}/0`,
    },
    salesOrders: {
      create: ECOM_API_DOMAIN + "/add_saleOrder",
      //list: ECOM_API_DOMAIN + "/get_product_quotes",
      getRecords: () =>
        `${ECOM_API_DOMAIN}/get_all_sale_order`,
      getRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/get_sale_order_by_id/${id}`,
      deleteRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_sale_order/${id}`,
      reStoreRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_sale_order/${id}/0`,
    },
    invoices: {
      create: ECOM_API_DOMAIN + "/add_invoice",
      //list: ECOM_API_DOMAIN + "/get_product_quotes",
      getRecords: () =>
        `${ECOM_API_DOMAIN}/get_all_invoice`,
      getRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/get_invoice_by_id/${id}`,
      deleteRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_invoice/${id}`,
      reStoreRecord: (id, ) =>
        `${ECOM_API_DOMAIN}/delete_invoice/${id}/0`,
    },
  },
  modules: {
    category: {
      add: ECOM_API_DOMAIN + "/products/category/add_category",
      list: ECOM_API_DOMAIN + "/products/category/get_categories",
    },
  },
  brands: {
    add: `${DEMO_DOMAIN}/auth/add_brand`,
    getByTenantId: (id) =>`${DEMO_DOMAIN}/api/all_brand?=${id}`,
  },
};
