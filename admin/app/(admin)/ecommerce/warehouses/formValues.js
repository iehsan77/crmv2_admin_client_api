export const getFormValues = (record) => ({
    id: record?.id || 0, // Keep undefined instead of 0 if no ID
      title: record?.title || "",
      slug: record?.slug || "",
      address: record?.address || "",
      contact_person: record?.contact_person || "",
      contact_number: record?.contact_number || "",
      contact_email: record?.contact_email || "",
      working_hours: record?.working_hours || "",
      active:
        record?.active === 1
          ? { label: "Yes", value: "1" }
          : record?.active === 0
          ? { label: "No", value: "0" }
          : { label: "", value: "" },
  });
  