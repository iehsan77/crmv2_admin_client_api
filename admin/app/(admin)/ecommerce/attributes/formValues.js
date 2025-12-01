export const getFormValues = (record) => ({
  id: record?.id || 0, // Keep undefined instead of 0 if no ID
  title: record?.title || "",
  slug: record?.slug || "",
  input_type:
    record?.input_type === "text"
      ? { label: "Text Field", value: "text" }
      : record?.input_type === "color"
      ? { label: "Color Box", value: "color" }
      : { label: "Text Field", value: "text" },
  active:
    record?.active === 1
      ? { label: "Yes", value: "1" }
      : record?.active === 0
      ? { label: "No", value: "0" }
      : { value: "", label: "" },
});
