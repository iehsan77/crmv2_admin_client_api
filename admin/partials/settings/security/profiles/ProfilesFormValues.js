export const ProfilesFormValues = (record) => ({
  id: record?.id || 0,
  title: record?.title || "",
  excerpt: record?.excerpt || "",
  sort_by: record?.sort_by ? Number(record?.sort_by) : 1,
  active:
    record?.active === 0
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },
});
