import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
} from "@/helper/GeneralFunctions";

import {
  TASKS_STATUS_OPTIONS,
  TASKS_PRIORITIES_OPTIONS,
  REMINDER_OPTIONS,
} from "@/constants/crm_constants";
import useTasksStore from "@/stores/crm/useTasksStore";

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
      header: "Subject",
      accessorKey: "subject",
      cell: ({ row }) => renderText(row.original?.subject),
    },
    {
      header: "Last Activity Date",
      accessorKey: "last_activity_date",
      cell: ({ row }) =>
        formatDateTime(row.original?.last_activity_date, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Assigned To",
      accessorKey: "assigned_to_id",
      cell: ({ row }) => getName(row.original?.assigned_to_details),
    },    
    {
      header: "Created Date",
      accessorKey: "createdon",
      cell: ({ row }) =>
        formatDateTime(row.original?.createdon, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) =>
        formatDateTime(row.original?.due_date, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Completion Date",
      accessorKey: "completed_on",
      cell: ({ row }) =>
        formatDateTime(row.original?.completed_on, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Reminder",
      accessorKey: "reminder",
      //cell: ({ row }) => getMocDataLabelByValue(REMINDER_OPTIONS, row.original?.reminder),
    },
    {
      header: "Status",
      accessorKey: "status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(TASKS_STATUS_OPTIONS, row.original?.status_id),
    },
    {
      header: "Priority",
      accessorKey: "priority_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          TASKS_PRIORITIES_OPTIONS,
          row.original?.priority_id
        ),
    },
    {
      header: "Related To",
      accessorKey: "related_to",
      cell: ({ row }) => renderText(row.original?.related_to),
    },
    {
      header: "Related To Name",
      accessorKey: "related_to_id",
      cell: ({ row }) => renderText(row.original?.related_to_details?.title),
    },
    {
      header: "Task Owner",
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
            module="tasks"
            title="Task"
            record={record}
            useStore={useTasksStore}
          />
        );
      },
    },
  ];
}
