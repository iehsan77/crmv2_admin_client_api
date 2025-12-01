import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
} from "@/helper/GeneralFunctions";
import {
  DEALS_SOURCE_OPTIONS,
  DEALS_STATUS_OPTIONS,
} from "@/constants/crm_constants";
import useDealsStore from "@/stores/crm/useDealsStore";

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
      header: "Deal Name",
      accessorKey: "title",
    },
    {
      header: "Contact Name",
      accessorKey: "contact_id",
      cell: ({ row }) => getName(row.original?.contact_details),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => renderText(row.original?.amount),
    },
    {
      header: "Deal Owner",
      accessorKey: "owner_id",
      cell: ({ row }) => {
        const owner = row.original?.owner_details;
        return getName(owner);
      },
    },
    {
      header: "Last Activity Date",
      accessorKey: "last_activity_date",
      cell: ({ row }) =>
        formatDateTime(
          row.original?.last_activity_date,
          "MMM dd, yyyy hh:mm a"
        ),
    },
    {
      header: "Expected Revenue",
      accessorKey: "expected_revenue",
      cell: ({ row }) => (
        <div style={{ textAlign: "right" }}>
          {"AED " + row.original?.expected_revenue}
        </div>
      ),
    },
    {
      header: "Deal Source",
      accessorKey: "source_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(DEALS_SOURCE_OPTIONS, row.original?.source_id),
    },

    {
      header: "Probability",
      accessorKey: "probability",
      cell: ({ row }) => (
        <div style={{ textAlign: "right" }}>
          {row.original?.probability + "%"}
        </div>
      ),
    },
    {
      header: "Stage",
      accessorKey: "status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(DEALS_STATUS_OPTIONS, row.original?.status_id),
    },
    {
      header: "Created Date",
      accessorKey: "createdon",
      cell: ({ row }) =>
        formatDateTime(row.original?.createdon, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Closing Date",
      accessorKey: "closing_date",
      cell: ({ row }) =>
        formatDateTime(row.original?.closing_date, "MMM dd, yyyy hh:mm a"),
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
            module="deals"
            title="Deal"
            record={record}
            useStore={useDealsStore}
          />
        );
      },
    },
  ];
}
