import { Icon } from "@iconify/react";

import Link from "next/link";
import Image from "next/image";

import { convertToCurrency } from "@/helper/EcomActions";

import { FaRegEdit, FaRegTrashAlt, FaTrashRestoreAlt } from "react-icons/fa";

export const getColumns = ({ currentPage, rowsPerPage, handleOpenModal }) => [
  {
    name: "#",
    cell: (record, index) => (currentPage - 1) * rowsPerPage + index + 1,
    width: "100px",
    style: { textAlign: "center" },
  },
  {
    name: "Thumbnail",
    selector: (record) => record?.logo,
    cell: (record) => (
      <Image
        src={record?.thumbnail}
        alt={record?.title}
        width="50"
        className="self-center"
        height={50}
      />
    ),
    width: "110px",
    style: { textAlign: "center" },
  },
  {
    name: "SKU",
    selector: (record) => record?.sku,
    width: "150px",
    sortable: true,
  },
  {
    name: "Product Title",
    selector: (record) => record?.title,
    sortable: true,
  },
  {
    name: "Product Category",
    selector: (record) =>
      !record?.category_id ? "Root Category" : record?.category_title,
    sortable: true,
  },
  {
    name: "Product Brand",
    selector: (record) => (record?.brand_title ? record?.brand_title : ""),
    sortable: true,
  },
  {
    name: "Price",
    selector: (record) => convertToCurrency(record?.price),
    sortable: true,
  },
  {
    name: "Sale Price",
    selector: (record) => convertToCurrency(record?.sale_price),
    sortable: true,
  },
  {
    name: "Is Active",
    selector: (record) => (record?.active ? "Yes" : "No"),
    width: "150px",
    sortable: true,
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
            <Link href={`/ecommerce/catalog/edit/${record?.id}`}>
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
    width: "100px",
    style: { textAlign: "center" },
  },
];
