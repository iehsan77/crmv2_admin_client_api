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
      header: "Deal Name",
      accessorKey: "title",
      cell: ({ row }) =>
        renderText(row.original?.title),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => renderText(row.original?.amount),
    },
    {
      header: "Closing Date",
      accessorKey: "closing_date",
      cell: ({ row }) => renderText(row.original?.closing_date),
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
