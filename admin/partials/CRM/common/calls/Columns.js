import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
} from "@/helper/GeneralFunctions";

import {
  CALLS_STATUS_OPTIONS,
  CALLS_TYPES_OPTIONS,
} from "@/constants/crm_constants";
import useCallsStore from "@/stores/crm/useCallsStore";

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
      cell: ({ row }) => row?.index + 1,
      size: 60,
      minSize: 60,
      maxSize: 80,
    },
    {
      header: "Subject",
      accessorKey: "subject",
      cell: ({ row }) => renderText(row.original?.subject),
    },
    {
      header: "Call Type",
      accessorKey: "type_id",
      cell: ({ row }) =>
        renderText(
          getMocDataLabelByValue(CALLS_TYPES_OPTIONS, row.original?.type_id)
        ),
    },
    {
      header: "Call Start Time",
      accessorKey: "start_time",
      cell: ({ row }) =>
        formatDateTime(row.original?.start_time, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Call Duration",
      accessorKey: "duration",
      cell: ({ row }) => renderText(row.original?.duration),
    },
    {
      header: "Outgoing Call Status",
      accessorKey: "status_id",
      cell: ({ row }) =>
        renderText(
          getMocDataLabelByValue(CALLS_STATUS_OPTIONS, row.original?.status_id)
        ),
    },
    {
      header: "Call Owner",
      accessorKey: "owner_id",
      cell: ({ row }) => {
        const owner = row.original?.owner_details;
        return getName(owner);
      },
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
        return (
          <RecordActions
            module="calls"
            title="Call"
            record={record}
            enableView={false}
            useStore={useCallsStore}
          />
        );
      },
    },
  ];
}
