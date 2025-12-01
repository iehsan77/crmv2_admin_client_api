"use client";

import React, { useState } from "react";
import {
  NotebookIcon,
  FileTextIcon,
  PaperclipIcon,
  ChevronRight,
} from "lucide-react";

import {
  LuHeartHandshake,
  LuFileSpreadsheet,
  LuFileCheck2,
  LuBookUser,
  LuFileBadge2,
} from "react-icons/lu";

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import useLeadsStore from "@/stores/crm/useLeadsStore";

export default function CustomerQuickLinksAccordion() {
  const [collapsed, setCollapsed] = useState(false);
  const record = useLeadsStore((s) => s.recordDetails);

  const links = [
    {
      label: "Leads",
      count: record?.leads?.length || 0,
      icon: LuFileBadge2,
    },
    {
      label: "Contacts",
      count: record?.contacts?.length || 0,
      icon: LuBookUser,
    },
    {
      label: "Deals",
      count: record?.deals?.length || 0,
      icon: LuHeartHandshake,
    },
    {
      label: "Invoices",
      count: record?.invoices?.length || 0,
      icon: FileTextIcon,
    },
    {
      label: "Quotes",
      count: record?.quotes?.length || 0,
      icon: LuFileSpreadsheet,
    },
    { label: "Orders", count: record?.orders?.length || 0, icon: LuFileCheck2 },
    {
      label: "Bookings",
      count: record?.bookings?.length || 0,
      icon: NotebookIcon,
    },
    {
      label: "Attachments",
      count: record?.attachments?.length || 0,
      icon: PaperclipIcon,
    },
  ];

  return (
    <div
      className={`sticky top-20 h-[85vh] transition-all duration-700 ${
        collapsed ? "w-14" : "w-72"
      }`}
    >
      <Card
        className={`relative h-full overflow-hidden rounded-lg shadow-sm transition-all duration-700 ${
          collapsed ? "w-14" : "w-72"
        } p-2`}
      >
        {/* Collapse/Expand toggle button */}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute -left-3 top-12 z-20 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center"
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Collapsed mode (icon-only view) */}
        {collapsed ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            {links.map((item) => (
              <button
                key={item.label}
                title={item.label}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          /* Expanded mode (accordion view) */
          <div className="mt-2">
            <Accordion type="multiple" className="w-full">
              {links.map((item) => (
                <AccordionItem
                  key={item.label}
                  value={item.label}
                  className="border-b border-[#E6F0FF] last:border-b-0"
                >
                  <AccordionTrigger className="py-3 px-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}{" "}
                        <span className="text-xs text-gray-500">
                          ({item.count})
                        </span>
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="p-3 text-sm text-muted-foreground">
                      No {item.label.toLowerCase()} available.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </Card>
    </div>
  );
}
