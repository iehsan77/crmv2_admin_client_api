export const WhatsappFormValues = (record) => ({
  id: record?.id || 0,

  provider_name: record?.provider_name || "",

  sandbox_mode:
    record?.sandbox_mode === 0
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },

  api_key: record?.api_key || "",
  phone_number_id: record?.phone_number_id || "",
  business_phone_number: record?.business_phone_number || "",
  webhook_url: record?.webhook_url || "",
  webhook_verify_token: record?.webhook_verify_token || "",
  webhook_events: record?.webhook_events || "",
  business_display_name: record?.business_display_name || "",
  business_website: record?.business_website || "",
});
