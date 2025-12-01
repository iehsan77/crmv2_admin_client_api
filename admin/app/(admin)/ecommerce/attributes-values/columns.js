import { FaRegEdit, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

export const getColumns = ({
  currentPage,
  rowsPerPage,
  handleOpenDrawer,
  handleOpenModal,
}) => [
  {
    name: "#",
    cell: (record, index) => (currentPage - 1) * rowsPerPage + index + 1,
    width: "100px",
    style: { textAlign: "center" },
  },
  {
    name: "Attribute Title",
    selector: (record) => record.attribute.title,
    sortable: true,
  },
  {
    name: "Attribute Value",
    selector: (record) => {
      if (
        ["color", "colours"].includes(record.attribute.title.toLowerCase())
      ) {
        return (
          <div className="flex items-center gap-2">
            <span style={{ width: "70px" }}>{record.title}</span>
            <span
              className="h-5 w-5"
              style={{ backgroundColor: record.title }}
            ></span>
          </div>
        );
      } else {
        return record.title;
      }
    },
    sortable: true,
  },  
  
  {
    name: "Is Active",
    selector: (record) => (record.active ? "Yes" : "No"),
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
            <FaRegEdit
              onClick={() => handleOpenDrawer(record)}
            />
            {/* {record.deletable === 1 && ( */}
            <FaRegTrashAlt
              onClick={() =>
                handleOpenModal(
                  record,
                  "Are you sure you want to delete this record?",
                  1
                )
              }
            />
            {/* )} */}
          </>
        )}
      </div>
    ),
    width: "100px",
    style: { textAlign: "center" },
  },
];
