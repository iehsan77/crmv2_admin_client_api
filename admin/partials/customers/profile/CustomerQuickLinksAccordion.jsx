"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  NotebookIcon,
  FileTextIcon,
  FileIcon,
  PaperclipIcon,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function CustomerQuickLinksAccordion() {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { label: "Bookings", count: 0, icon: NotebookIcon },
    { label: "Invoices", count: 0, icon: FileTextIcon },
    { label: "Quotes", count: 0, icon: FileIcon },
    //{ label: "Attachments", count: 0, icon: PaperclipIcon },
  ];

  return (
    <div
      className={`sticky top-20 h-[85vh] ${
        collapsed ? "w-14" : "w-72"
      } transition-all duration-1000`}
    >
      {/* Card / Sidebar */}
      <Card
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          collapsed ? "w-14" : "w-72"
        } h-full rounded-lg shadow-sm p-2`}
      >
        {/* Overall collapse/expand button (left-circle) */}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((s) => !s)}
          className="absolute -left-3 top-12 z-20 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center"
        >
          {/* Rotate this icon when collapsed to indicate state */}
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Collapsed mode: show icon-only vertical list */}
        {collapsed ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            {links.map((item) => (
              <button
                key={item.label}
                title={item.label}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          /* Expanded mode: full accordion */
          <div className="mt-2">
            <Accordion type="multiple" collapsible className="w-full">
              {links.map((item) => (
                <AccordionItem
                  key={item.label}
                  value={item.label}
                  className="border-b border-[#CCE1FF] last:border-b-0"
                >
                  <AccordionTrigger className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5 text-muted-foreground" />

                      <span className="text-sm font-medium">
                        {item.label} ({item.count})
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
