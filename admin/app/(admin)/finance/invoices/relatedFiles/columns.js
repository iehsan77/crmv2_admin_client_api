import Link from "next/link";

import { FaRegEdit, FaEye, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

import {
  getDate,
  getFormatedNameEmail,
  convertToCurrency,
} from "@/helper/EcomActions";

export const getColumns = ({ currentPage, rowsPerPage, handleOpenModal }) => [
  {
    name: "#",
    cell: (record, index) => (currentPage - 1) * rowsPerPage + index + 1,
    width: "60px",
    style: { textAlign: "center" },
  },
  {
    name: "Invoice #",
    selector: (record) => record?.invoice_no,
    sortable: true,
    width: "160px",
  },
  {
    name: "Date",
    selector: (record) => (record?.date && getDate(record?.date)) || "",
    sortable: true,
    width: "160px",
  },
  {
    name: "Due Date",
    selector: (record) => (record?.due_date && getDate(record?.due_date)) || "",
    sortable: true,
    width: "160px",
  },
  {
    name: "Grand Total",
    selector: (record) =>
      record?.grand_total && convertToCurrency(record?.grand_total),
    sortable: true,
  },
  {
    name: "Customer",
    selector: (record) => getFormatedNameEmail(record?.customer_name),
    sortable: true,
  },
  {
    name: "Sales Person",
    selector: (record) => getFormatedNameEmail(record?.sales_person_name),
    sortable: true,
  },
  {
    name: "Status",
    selector: (record) => record?.status && JSON.parse(record?.status).label,
    sortable: true,
    width: "130px",
  },
  {
    name: "Actions",
    cell: (record) => (
      <div className="flex justify-center items-center gap-2">
        {record?.deleted ? (
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
            <Link href={ADMIN_PATHS?.FINANCE?.INVOICES?.VIEW(record?.id)}>
              <FaEye />
            </Link>
            <Link href={ADMIN_PATHS?.FINANCE?.INVOICES?.EDIT(record?.id)}>
              <FaRegEdit />
            </Link>
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
    width: "120px",
    style: { textAlign: "center" },
  },
];
