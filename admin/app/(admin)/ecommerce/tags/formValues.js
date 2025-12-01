export const getFormValues = (record) => ({
    id: record?.id || 0, // Keep undefined instead of 0 if no ID
    title: record?.title || "",
    slug: record?.slug || "",
    active:
      record?.active === 1
        ? { label: "Yes", value: "1" }
        : record?.active === 0
        ? { label: "No", value: "0" }
        : { value: "", label: "" },
  });
  