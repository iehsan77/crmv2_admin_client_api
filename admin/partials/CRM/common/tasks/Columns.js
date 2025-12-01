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
} from "@/constants/crm_constants";
import useTasksStore from "@/stores/crm/useTasksStore";

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
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) =>
        formatDateTime(row.original?.due_date, "MMM dd, yyyy hh:mm a"),
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
    /*
    {
      header: "Related To",
      accessorKey: "related_to",
      cell: ({ row }) => renderText(row.original?.task_for),
    },
    {
      header: "Related To Name",
      accessorKey: "related_to_id",
      cell: ({ row }) => renderText(row.original?.related_to_details?.title),
    },
    */
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
            enableView={false}
          />
        );
      },
    },
  ];
}
