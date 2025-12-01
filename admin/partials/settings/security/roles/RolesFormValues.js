export const RolesFormValues = (record) => {
  let reportToValue;
  if (record?.report_to) {
    try {
      reportToValue =
        typeof record.report_to === "string"
          ? JSON.parse(record.report_to)
          : record.report_to;
    } catch {
      // fallback if parsing fails
      reportToValue = { label: "Self", value: "0" };
    }
  } else {
    reportToValue = { label: "Self", value: "0" };
  }

  return {
    id: record?.id || 0,
    title: record?.title || "",
    report_to_id: record?.report_to_id,
    report_to: reportToValue,
    excerpt: record?.excerpt || "",
    active:
      record?.active === 0
        ? { label: "No", value: "0" }
        : { label: "Yes", value: "1" },
  };
};
