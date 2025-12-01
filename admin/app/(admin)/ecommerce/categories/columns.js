import Link from "next/link";
import { Icon } from "@iconify/react";

import Image from "next/image";

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
    selector: (record) => record.logo,
    cell: (record) =>
      record.thumbnail && (
        <Image
          src={record.thumbnail}
          alt={record.title}
          width="50"
          className="self-center"
          height={50}
        />
      ),
    width: "110px",
    style: { textAlign: "center" },
  },
  {
    name: "Title",
    selector: (record) => record.title,
    sortable: true,
  },
  {
    name: "Parents",
    selector: (record) => record.parents,
    sortable: true,
  },
  {
    name: "Show in Store",
    selector: (record) => (record.show_in_store === 1 ? "YES" : "NO"),
    sortable: true,
    width: "150px",
  },
  {
    name: "Show in Menu",
    selector: (record) => (record.show_in_menu === 1 ? "YES" : "NO"),
    sortable: true,
    width: "150px",
  },
  {
    name: "Is Active",
    selector: (record) => (record.active ? "Yes" : "No"),
    sortable: true,
    width: "150px",
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
            <Link href={`/categories/edit/${record?.id}`}>
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
