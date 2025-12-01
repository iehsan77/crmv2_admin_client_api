
import { FaRegEdit, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

export const getColumns = ({
  currentPage,
  rowsPerPage,
  handleOpenDrawer,
  handleOpenModal,
}) => [
  {
    name: "#",
    cell: (row, index) => (currentPage - 1) * rowsPerPage + index + 1,
    width: "100px",
    style: { textAlign: "center" },
  },
  { name: "Title", selector: (row) => row.title, sortable: true },
  {
    name: "Contact Person",
    selector: (row) => row.contact_person,
    sortable: true,
  },
  {
    name: "Contact Person Number",
    selector: (row) => row.contact_person,
    sortable: true,
  },
  {
    name: "Is Active",
    selector: (row) => (row.active ? "Yes" : "No"),
    sortable: true,
  },
  {
    name: "Actions",
    cell: (record) => (
      <div className="flex justify-center items-center gap-2">
        {record.deleted ? (
          <FaTrashRestoreAlt
            onClick={() =>
              handleOpenModal(
                record,
                "Are you sure you want to restore this record?",
                0
              )
            }
          />
        ) : (
          <>
            <FaRegEdit onClick={() => handleOpenDrawer(record)} />
            <FaRegTrashAlt
              onClick={() =>
                handleOpenModal(
                  record,
                  "Are you sure you want to delete this record?",
                  1
                )
              }
            />
          </>
        )}
      </div>
    ),
    width: "100px",
    style: { textAlign: "center" },
  },
];
