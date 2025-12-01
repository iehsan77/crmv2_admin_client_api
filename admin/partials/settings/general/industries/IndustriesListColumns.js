import ActionsBtns from "@/components/ActionsBtns";

export const IndustriesListColumns = ({
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
    name: "Title",
    selector: (record) => record?.title,
    sortable: true,
  },
  {
    name: "Short Description",
    selector: (record) => record?.excerpt,
    sortable: true,
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
