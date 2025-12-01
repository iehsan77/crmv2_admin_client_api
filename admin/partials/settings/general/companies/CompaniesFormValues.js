export const CompaniesFormValues = (record) => {

  return {
    id: record?.id || 0,

    // General Info
    company_name: record?.company_name || "",
    excerpt: record?.excerpt || "",

    industry: record?.industry
      ? { label: String(record.industry), value: String(record.industry) }
      : null,

    company_size: record?.company_size
      ? { label: String(record.company_size), value: String(record.company_size) }
      : null,

    website: record?.website || "",

    logo: "",
    old_logo: record?.logo || "",

    // Address Info
    address: record?.address || "",
    zip_code: record?.zip_code || "",
    city: record?.city || "",
    state: record?.state || "",
    country: record?.country || "",

    // Contact Info
    email: record?.email || "",
    phone: record?.phone || "",
    fax: record?.fax || "",
    contact_person: record?.contact_person || "",

    // Other Info
    sort_by: record?.sort_by ? Number(record.sort_by) : 1,

    active:
      record?.active === 0 || record?.active?.value === "0"
        ? { label: "No", value: "0" }
        : { label: "Yes", value: "1" },
  };
};
