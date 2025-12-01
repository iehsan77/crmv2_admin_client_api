import Link from "next/link";
import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
} from "@/helper/GeneralFunctions";
import { COMPANY_TYPES } from "@/constants/crm_constants";

export default function Columns() {
  const renderText = (value) => {
    if (!value) return "-";
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return [
    {
      id: "sno",
      header: "S.No.",
      cell: ({ row }) => row.index + 1,
      size: 60,
      minSize: 60,
      maxSize: 80,
    },
    {
      header: "Account Name",
      accessorKey: "title",
      cell: ({ row }) => renderText(row.original?.title),
    },
    {
      header: "Account Domain Name",
      accessorKey: "website",
      cell: ({ row }) => renderText(row.original?.website),
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
