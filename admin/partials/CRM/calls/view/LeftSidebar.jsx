"use client";

import { Card, CardContent } from "@/components/ui/card";
import LeftSidebarHeader from "./LeftSidebarHeader";
import LeftSidebarActions from "./LeftSidebarActions";

import useAccountsStore from "@/stores/crm/useAccountsStore";

export default function LeftSidebar() {

  const record = useAccountsStore((s) => s.recordDetails);

  const fields = [
    { label: "Website", value: record?.website },
    { label: "Industry", value: record?.industry },
    { label: "Company Owner", value: record?.owner_details?.first_name+" "+record?.owner_details?.last_name },
    { label: "Type", value: record?.type },
    { label: "Phone Number", value: record?.phone },
    { label: "Mobile Number", value: record?.mobile },
    { label: "Annual Revenue", value: "AED "+record?.annual_revenue },
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
