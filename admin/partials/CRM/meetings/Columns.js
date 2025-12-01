import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
} from "@/helper/GeneralFunctions";
import useMeetingsStore from "@/stores/crm/useMeetingsStore";
import { MEETINGS_STATUS_OPTIONS } from "@/constants/crm_constants";

export default function Columns({ page = 1, limit = 20 }) {
  const renderText = (value) => {
    if (!value) return "-";
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  const startIndex = (page - 1) * limit;

  return [
    /*
    {
      id: "sno",
      header: "S.No.",
      cell: ({ row }) => startIndex + (row.index + 1),
      size: 60,
      minSize: 60,
      maxSize: 80,
    },
    */
    {
      id: "sno",
      header: () => <div style={{ textAlign: "center" }}>S.No.</div>,
      cell: ({ row }) => (
        <div style={{ textAlign: "center" }}>
          {startIndex + (row.index + 1)}
        </div>
      ),
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => renderText(row.original?.title),
    },
    {
      header: "From",
      accessorKey: "start_time",
      cell: ({ row }) =>
        formatDateTime(row.original?.start_time, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "To",
      accessorKey: "end_time",
      cell: ({ row }) =>
        formatDateTime(row.original?.end_time, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Related To",
      accessorKey: "related_to",
      cell: ({ row }) => renderText(row.original?.related_to),
    },
    {
      header: "Location",
      accessorKey: "location",
    },
    {
      header: "Venue",
      accessorKey: "venue",
    },
    {
      header: "Status",
      accessorKey: "status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          MEETINGS_STATUS_OPTIONS,
          row.original?.status_id
        ),
    },
    {
      header: "Related To Name",
      accessorKey: "related_to_id",
      cell: ({ row }) => {
        const details = row.original?.related_to_ids_details || [];
        if (!details.length) return renderText("-");

        return (
          <div className="space-y-1">
            {details.map((item, index) => (
              <div key={index}>{renderText(item?.title)}</div>
            ))}
          </div>
        );
      },
    },
    {
      header: "Meeting Owner",
      accessorKey: "owner_id",
      cell: ({ row }) => {
        const owner = row.original?.owner_details;
        return renderText(
          owner
            ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
            : null
        );
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
            module="meetings"
            title="Meeting"
            record={record}
            useStore={useMeetingsStore}
          />
        );
      },
    },
  ];
}
