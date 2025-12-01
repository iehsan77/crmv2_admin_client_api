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
      header: "Account Name",
      accessorKey: "title",
      cell: ({ row }) => renderText(row.original?.title),
    },
    {
      header: "Account Domain Name",
      accessorKey: "website",
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ row }) => renderText(row.original?.phone),
    },
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
