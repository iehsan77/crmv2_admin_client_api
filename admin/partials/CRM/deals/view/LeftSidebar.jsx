"use client";

import { Card, CardContent } from "@/components/ui/card";
import LeftSidebarHeader from "./LeftSidebarHeader";
import LeftSidebarActions from "./LeftSidebarActions";

import useDealsStore from "@/stores/crm/useDealsStore";
import {
  DEALS_STATUS_OPTIONS,
  DEALS_TYPES_OPTIONS,
} from "@/constants/crm_constants";
import { getMocDataLabelByValue, getName } from "@/helper/GeneralFunctions";

export default function LeftSidebar() {
  const record = useDealsStore((s) => s.recordDetails);

  const fields = [
    { label: "Deal Owner", value: record?.owner_id },
    { label: "Account", value: record?.account_details?.title },

    {
      label: "Deal Type",
      value: getMocDataLabelByValue(DEALS_TYPES_OPTIONS, record?.type_id),
    },

    { label: "Contact Name", value: getName(record?.contact_details) },
    { label: "Amount", value: record?.amount },

    { label: "Closing Date", value: record?.closing_date },

    {
      label: "Deal Status",
      value: getMocDataLabelByValue(DEALS_STATUS_OPTIONS, record?.status_id),
    },

    { label: "Probablity", value: record?.probablity },
    { label: "Expected Revenue", value: record?.expected_revenue },
    { label: "Description", value: record?.description },
  ];

  return (
    <Card className="sticky top-20 w-72 h-[85vh] rounded-lg shadow-md border p-0 flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1 h-full">
        {/* Header */}
        <LeftSidebarHeader record={record} />
        {/* <LeftSidebarActions record={record} /> */}

        <hr className="mx-4" />

        {/* Scrollable Details */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="px-4 py-3 text-sm">
            <details open>
              <summary className="cursor-pointer font-medium text-muted-foreground">
                About This Deal
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
