import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
  getName,
} from "@/helper/GeneralFunctions";
import {
  CONTACTS_SOURCES_OPTIONS,
  CONTACTS_STATUS_OPTIONS,
} from "@/constants/crm_constants";
import { COUNTRIES, STATES, USER_ROLES } from "@/constants/general_constants";
import useContactsStore from "@/stores/crm/useContactsStore";

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
      header: "Contact Name",
      accessorKey: "name", // optional — for consistency
      cell: ({ row }) => getName(row.original),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
    },
    {
      header: "Mobile",
      accessorKey: "mobile",
    },
    {
      header: "Account Name",
      accessorKey: "account_id",
      cell: ({ row }) => renderText(row.original?.account_details?.title),
    },
    {
      header: "Source",
      accessorKey: "source_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          CONTACTS_SOURCES_OPTIONS,
          row.original?.source_id
        ),
    },
    {
      header: "Contact Owner",
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
      header: "Contact Role",
      accessorKey: "role_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(USER_ROLES, row.original?.role_id),
    },


    
    {
      header: "Assigned To",
      accessorKey: "assigned_to_id",
      cell: ({ row }) => getName(row.original?.assigned_to_details),
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
      header: "Website",
      accessorKey: "website",
    },
    {
      header: "Country",
      accessorKey: "country_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(COUNTRIES, row.original?.country_id),
    },
    {
      header: "State",
      accessorKey: "state_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(STATES, row.original?.state_id),
    },
    {
      header: "Zip Code",
      accessorKey: "postal_code",      
    },
    {
      header: "Status",
      accessorKey: "status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          CONTACTS_STATUS_OPTIONS,
          row.original?.status_id
        ),
    },
    {
      header: "Created Date",
      accessorKey: "createdon",
      cell: ({ row }) =>
        formatDateTime(row.original?.created_at, "MMM dd, yyyy hh:mm a"),
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
            module="contacts"
            title="Contact"
            record={record}
            useStore={useContactsStore}
          />
        );
      },
    },
  ];
}
