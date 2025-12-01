
import { isValidDate } from "@/helper/EcomActions";

export const getFormDefaultValues = (record) => {

  return {
    id: record?.id || 0,
    quotation_id: record?.quotation_no && JSON.parse(record?.quotation_no),
    sales_person_id: record?.sales_person_id && {
      value: String(record?.sales_person_id),
      label: String(record?.sales_person_name),
    },
    subject: record?.subject || "",
    //team: record?.team || "",
    /*
    carrier: record?.carrier && {
      value: String(record?.carrier),
      label: String(record?.carrier),
    },
    */
   carrier: record?.carrier && JSON.parse(record?.carrier) || "",
    date: isValidDate(record?.date) && new Date(record?.date),

    customer_id: record?.customer_id && {
      value: String(record?.customer_id),
      label: String(record?.customer_name),
    },
    /*
    status: record?.status && {
      value: String(record?.status),
      label: String(record?.status),
    },
    */
   status: record?.status && JSON.parse(record?.status) || "",
    expected_delivery_date: isValidDate(record?.expected_delivery_date) && new Date(record?.expected_delivery_date),
    conversion_date:isValidDate(record?.conversion_date) && new Date(record?.conversion_date),

    billing_street: record?.billing_street || "",
    billing_city: record?.billing_city || "",
    billing_state: record?.billing_state || "",
    billing_code: record?.billing_code || "",
    billing_country: record?.billing_country || "",

    shipping_street: record?.shipping_street || "",
    shipping_city: record?.shipping_city || "",
    shipping_state: record?.shipping_state || "",
    shipping_code: record?.shipping_code || "",
    shipping_country: record?.shipping_country || "",

    items: record?.items?.length
      ? JSON.parse(record?.items)
      : [
          {
            product_id: 0,
            product: {},
            description: "",
            quantity: "",
            price: "",
            amount: "",
            discount: "",
            tax: "",
            total: "",
          },
        ],

    terms_conditions: record?.terms_conditions || "",
    description: record?.description || "",
  };
};
