"use client";

import { Card, CardContent } from "@/components/ui/card";
import LeftSidebarHeader from "./LeftSidebarHeader";
import LeftSidebarActions from "./LeftSidebarActions";

import { getMocDataLabelByValue, getName } from "@/helper/GeneralFunctions";

import useAccountsStore from "@/stores/crm/useAccountsStore";
import {
  ACCOUNTS_STATUS_OPTIONS,
  ACCOUNTS_TYPES,
} from "@/constants/crm_constants";
import { INDUSTRIES } from "@/constants/general_constants";

export default function LeftSidebar() {
  const record = useAccountsStore((s) => s.recordDetails);

  const fields = [
    { label: "Account Owner", value: getName(record?.owner_details) },

    { label: "Parent Account", value: getName(record?.parent_details) },

    { label: "Account Location", value: record?.location },
    { label: "Account Number", value: record?.account_number },
    {
      label: "Account Type",
      value: getMocDataLabelByValue(ACCOUNTS_TYPES, record?.type_id),
    },
    {
      label: "Account Status",
      value: getMocDataLabelByValue(ACCOUNTS_STATUS_OPTIONS, record?.status_id),
    },
    {
      label: "Industry",
      value: getMocDataLabelByValue(INDUSTRIES, record?.industry_id),
    },
    { label: "Annual Revenue", value: "AED " + record?.annual_revenue },

    { label: "Employees", value: record?.employees },
    { label: "Phone Number", value: record?.phone },
    { label: "Mobile Number", value: record?.mobile },
    { label: "Website", value: record?.website },
    { label: "Fax", value: record?.fax },
  ];

  return (
    <Card className="sticky top-20 w-72 h-[85vh] rounded-lg shadow-md border p-0 flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1 h-full">
        {/* Header */}
        <LeftSidebarHeader record={record} />
        <LeftSidebarActions record={record} />

        <hr className="mx-4" />

        {/* Scrollable Details */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="px-4 py-3 text-sm">
            <details open>
              <summary className="cursor-pointer font-medium text-muted-foreground">
                About This Account
              </summary>
              <div className="mt-3 space-y-3">
                {fields.map((item, idx) => (
                  <div key={idx}>
                    <p className="font-medium text-primary">{item.label}</p>
                    <p>{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
