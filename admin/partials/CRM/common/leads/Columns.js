import Link from "next/link";
import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
} from "@/helper/GeneralFunctions";
import { COMPANY_TYPES } from "@/constants/crm_constants";

export default function Columns({currentPage, itemsPerPage}) {
  const renderText = (value) => {
    if (!value) return "-";
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  return [
    {
      id: "serial",
      accessorKey: "id",
      header: () => <div className="text-center">#</div>,
      cell: ({ row }) => {
        const serial = (currentPage - 1) * itemsPerPage + (row.index + 1);
        return <span className="block text-center">{serial}</span>;
      },
    }, 
    {
      header: "Contact Name",
      accessorKey: "title",
      cell: ({ row }) =>
        renderText(row.original?.first_name + " " + row.original?.last_name),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => renderText(row.original?.email),
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ row }) => renderText(row.original?.phone),
    },
    {
      header: "Owner",
      accessorKey: "owner_id",
      cell: ({ row }) =>
        renderText(
          row.original?.owner_details?.first_name +
            " " +
            row.original?.owner_details?.last_name
        ),
    },
    /*
    {
      header: "Role",
      accessorKey: "role_id",
      cell: ({ row }) =>
        renderText(row.original?.owner_details?.role_details?.title),
    },
    */
    {
      id: "actions",
      header: "Actions",
      size: 150, // ✅ fits buttons nicely
      minSize: 140,
      maxSize: 160,
      enableResizing: false,
      cell: ({ row }) => {
        const record = row.original;
        return <RecordActions record={record} />;
      },
    },
  ];
}
