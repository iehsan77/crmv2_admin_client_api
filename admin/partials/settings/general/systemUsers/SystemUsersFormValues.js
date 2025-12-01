export const SystemUsersFormValues = (record) => ({
  id: record?.id || 0,
  name: record?.name || "",
  last_name: record?.last_name || "",
  email: record?.email || "",

  // Passwords empty by default (especially useful for edit forms)
  password: "",
  confirm_password: "",

  role_id: Number(record?.role_id || 0),
  role: record?.role ? JSON.parse(record.role) : null,

  profile_id: Number(record?.profile_id || 0),
  profile: record?.profile ? JSON.parse(record.profile) : null,

  sort_by: record?.sort_by ? Number(record?.sort_by) : 0,

  active:
    record?.active === 0 || record?.active?.value === "0"
      ? { label: "No", value: "0" }
      : { label: "Yes", value: "1" },
});
