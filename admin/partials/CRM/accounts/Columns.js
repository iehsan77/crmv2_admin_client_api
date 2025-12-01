import Link from "next/link";

import RecordActions from "@/partials/crm/common/RecordActions";

import {
  formatDateTime,
  getMocDataLabelByValue,
} from "@/helper/GeneralFunctions";

import {
  ACCOUNTS_STATUS_OPTIONS,
  ACCOUNTS_TYPES,
  COMPANY_TYPES,
} from "@/constants/crm_constants";

import { getName } from "@/helper/GeneralFunctions";

import useAccountsStore from "@/stores/crm/useAccountsStore";
import { INDUSTRIES } from "@/constants/general_constants";

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
      header: "Account Name",
      accessorKey: "title",
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
      header: "Website",
      accessorKey: "website",
    },
    {
      header: "Account Owner",
      accessorKey: "owner_id",
      cell: ({ row }) => {
        const owner = row.original?.owner_details;
        return getName(owner);
      },
    },
    {
      header: "Annual Revenue",
      accessorKey: "annual_revenue",
      cell: ({ row }) => (
        <div style={{ textAlign: "right" }}>
          {"AED " + row.original?.annual_revenue}
        </div>
      ),
    },
    {
      header: "Employees",
      accessorKey: "employees",
      cell: ({ row }) => (
        <div style={{ textAlign: "center" }}>{row.original?.employees}</div>
      ),
    },

    {
      header: "Account Type",
      accessorKey: "type_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(ACCOUNTS_TYPES, row.original?.type_id),
    },
    {
      header: "Industry",
      accessorKey: "industry_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(INDUSTRIES, row.original?.industry_id),
    },
    {
      header: "Employees",
      accessorKey: "employees",
      cell: ({ row }) => renderText(row.original?.employees),
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
      header: "Created Date",
      accessorKey: "createdon",
      cell: ({ row }) =>
        formatDateTime(row.original?.createdon, "MMM dd, yyyy hh:mm a"),
    },
    {
      header: "Status",
      accessorKey: "status_id",
      cell: ({ row }) =>
        getMocDataLabelByValue(
          ACCOUNTS_STATUS_OPTIONS,
          row.original?.status_id
        ),
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
            module="accounts"
            title="Account"
            record={record}
            useStore={useAccountsStore}
          />
        );
      },
    },
  ];
}
