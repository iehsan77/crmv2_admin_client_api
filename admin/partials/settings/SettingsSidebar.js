"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Assuming ADMIN_PATHS is globally available or imported somewhere
const SETTINGS = typeof ADMIN_PATHS !== "undefined" ? ADMIN_PATHS?.SETTINGS : null;

export default function SettingsSidebar({ selected }) {
  // Early return if SETTINGS not available or empty
  if (!SETTINGS || Object.keys(SETTINGS).length === 0) {
    return (
      <div className="p-4 text-gray-500 font-semibold">No Settings Available</div>
    );
  }

  // Memoize keys and default open sections to avoid recalculation on each render
  const sectionKeys = useMemo(() => Object.keys(SETTINGS), [SETTINGS]);
  const defaultOpenSections = useMemo(
    () => sectionKeys.map((_, index) => `section-${index}`),
    [sectionKeys]
  );

  return (
    <div>
      <div className="p-2 font-semibold">System Settings</div>
      <div className="h-screen overflow-y-auto">
        <Accordion
          type="multiple"
          className="w-full p-2"
          defaultValue={defaultOpenSections}
        >
          {Object.entries(SETTINGS).map(([section, items], sectionIndex) => (
            <AccordionItem
              key={`section-${sectionIndex}`}
              value={`section-${sectionIndex}`}
            >
              <AccordionTrigger className="capitalize">
                {section.replace(/_/g, " ").toLowerCase()}
              </AccordionTrigger>
              <AccordionContent>
                {items && Object.entries(items).length > 0 ? (
                  <ul className="space-y-1">
                    {Object.entries(items).map(([itemKey, link], itemIndex) => (
                      <li key={`item-${sectionIndex}-${itemIndex}`}>
                        <Link
                          href={link}
                          prefetch={true} // Prefetch for faster navigation
                          className="text-sm text-[#1E3A8A] hover:underline block px-2 py-1 capitalize"
                        >
                          {itemKey.replace(/_/g, " ").toLowerCase()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 px-2 py-1">No items</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
