import Link from "next/link";

import {
  FaRegEdit,
  FaEye,
  FaRegTrashAlt,
  FaTrashRestoreAlt,
} from "react-icons/fa";

import {
  getDate,
  getFormatedNameEmail,
  convertToCurrency,
} from "@/helper/EcomActions";

import Image from "next/image";

export const getColumns = ({ currentPage, rowsPerPage, handleOpenModal }) => [
  {
    name: "#",
    cell: (record, index) => (currentPage - 1) * rowsPerPage + index + 1,
    width: "60px",
    style: { textAlign: "center" },
  },
  {
    name: "Quotation #",
    selector: (record) => record?.quotation_no,
    sortable: true,
    width: "160px",
  },
  {
    name: "Quotation Date",
    selector: (record) => (record?.date && getDate(record?.date)) || "",
    sortable: true,
    width: "160px",
  },
  {
    name: "Expiry Date",
    selector: (record) =>
      (record?.expiry_date && getDate(record?.expiry_date)) || "",
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
    selector: (record) => {
      try {
        return record?.status ? JSON.parse(record?.status)?.label : "";
      } catch (error) {
        return record?.status; // Return the raw string if not valid JSON
      }
    },
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
            <Link href={ADMIN_PATHS?.FINANCE?.QUOTES?.VIEW(record?.id)}>
              <FaEye />
            </Link>
            <Link href={ADMIN_PATHS?.FINANCE?.QUOTES?.EDIT(record?.id)}>
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
