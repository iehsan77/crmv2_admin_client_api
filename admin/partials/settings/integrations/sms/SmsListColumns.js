import ActionsBtns from "@/components/ActionsBtns";

export const SmsListColumns = ({
  page = 1,
  rpp = 10,
  onEdit,
  onDelete,
  onRestore,
}) => [
  {
    name: "#",
    cell: (record, index) => (page - 1) * rpp + index + 1,
    width: "80px",
    center: "center", // Correct usage: boolean not string
    style: { textAlign: "center" },
  },
  {
    name: "Provider Name",
    selector: (record) => record?.provider_name,
    sortable: true,
  },
  {
    name: "API URL",
    selector: (record) => record?.api_url,
    sortable: true,
  },
  {
    name: "Sender ID",
    selector: (record) => record?.sender_id,
    sortable: true,
  },
  {
    name: "Sender Phone",
    selector: (record) => record?.sender_phone,
    sortable: true,
  },
  {
    name: "Is Default",
    selector: (record) => (record?.default ? "Yes" : "No"),
    sortable: true,
    width: "150px",
    center: "center",
  },
  {
    name: "Is Active",
    selector: (record) => (record?.active ? "Yes" : "No"),
    sortable: true,
    width: "150px",
    center: "center",
  },
  {
    name: "Sort By",
    selector: (record) => record?.sort_by,
    sortable: true,
    width: "150px",
    center: "center",
  },
  {
    name: "Actions",
    cell: (record) => (
      <ActionsBtns
        record={record}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
      />
    ),
    width: "150px",
    center: "center",
    style: { textAlign: "center" },
  },
];
