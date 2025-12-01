"use client";

import { Card, CardContent } from "@/components/ui/card";
import LeftSidebarHeader from "./LeftSidebarHeader";
import LeftSidebarActions from "./LeftSidebarActions";

import useLeadsStore from "@/stores/crm/useLeadsStore";

export default function LeftSidebar() {

  const record = useLeadsStore((s) => s.recordDetails);

  const fields = [
    
    { label: "Lead Title", value: record?.title },

    //{ label: "Lead Owner", value: record?.owner_id },
    //{ label: "Assigned To", value: record?.assigned_to_id },
    //{ label: "Source", value: record?.source_id },

    { label: "Email", value: record?.email },

    // { label: "Account", value: record?.account_id },
    // { label: "Status", value: record?.status_id },

    { label: "Phone", value: record?.phone },
    { label: "Mobile", value: record?.mobile },
    { label: "Fax", value: record?.fax },

    { label: "Address 1", value: record?.address1 },
    { label: "Address 2", value: record?.address2 },
    { label: "Website", value: record?.website },

    { label: "Description", value: record?.description },

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
                About This Lead
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
