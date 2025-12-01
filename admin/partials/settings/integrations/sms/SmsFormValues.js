export const SmsFormValues = (record) => ({
  id: record?.id || 0,

  provider_name: record?.provider_name || "",
  api_url: record?.api_url || "",
  api_key: record?.api_key || "",
  sender_id: record?.sender_id || "",
  sender_phone: record?.sender_phone || "",

  default:
    record?.default === 0
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },

  sort_by: record?.sort_by ? Number(record?.sort_by) : 1,
  active:
    record?.active === 0
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },
});
