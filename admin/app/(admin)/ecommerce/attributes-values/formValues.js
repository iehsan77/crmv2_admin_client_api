export const getFormValues = (record) => ({
  id: record?.id || 0, // Keep undefined instead of 0 if no ID
  attribute_id: record?.attribute_id || "",
  title: record?.title || "",
  active:
    record?.active === 1
      ? { label: "Yes", value: "1" }
      : record?.active === 0
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },
});
