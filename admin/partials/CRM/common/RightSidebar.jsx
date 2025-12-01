"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import LeadsCardActions from "./leads/CardActions";
import ContactsCardActions from "./contacts/CardActions";
import DealsCardActions from "./deals/CardActions";
import AccountsCardActions from "./accounts/CardActions";
import InvoicesCardActions from "./invoices/CardActions";
import QuotesCardActions from "./quotes/CardActions";
import OrdersCardActions from "./orders/CardActions";
import BookingsCardActions from "./bookings/CardActions";
import AttachmentsCardActions from "./attachments/CardActions";

import { useLeadsAssociationStore } from "@/stores/crm/useLeadsStore";
import { useDealsAssociationStore } from "@/stores/crm/useDealsStore";
//import { useQuotesAssociationStore } from "@/stores/crm/useQuotesStore";
//import { useOrdersAssociationStore } from "@/stores/crm/useOrdersStore";
import { useContactsAssociationStore } from "@/stores/crm/useContactsStore";
import { useAccountsAssociationStore } from "@/stores/crm/useAccountsStore";
//import { useInvoicesAssociationStore } from "@/stores/crm/useInvoicesStore";
import useAttachmentsStore from "@/stores/crm/useAttachmentsStore";
import { useBookingsAssociationStore } from "@/stores/rentify/useBookingsStore";

export default function RightSidebar({ links = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  const { counter: leadCounter } = useLeadsAssociationStore();
  const { counter: dealsCounter } = useDealsAssociationStore();
  const { counter: contactsCounter } = useContactsAssociationStore();
  const { counter: accountsCounter } = useAccountsAssociationStore();
  const { counter: bookingsCounter } = useBookingsAssociationStore();
  const { counter: attachmentsCounter } = useAttachmentsStore();

  const counters = {
    Leads: leadCounter,
    Contacts: contactsCounter,
    Deals: dealsCounter,
    Accounts: accountsCounter,
    Bookings: bookingsCounter,
    Attachments: attachmentsCounter,
  };

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
                        {item.label}
                        <span className="text-xs text-gray-500 ms-1">
                          ({counters[item.label] || 0})
                        </span>
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="p-0">
                    <div className="text-sm text-muted-foreground">
                      {item.label === "Leads" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <LeadsCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Contacts" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <ContactsCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Deals" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <DealsCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Accounts" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <AccountsCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Invoices" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <InvoicesCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Quotes" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <QuotesCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Orders" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <OrdersCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Bookings" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <BookingsCardActions />
                          </div>
                        </>
                      )}

                      {item.label === "Attachments" && (
                        <>
                          <div className="p-2">
                            <p className="mb-4">
                              Add {item.label} or associate {item.label}
                            </p>
                            <AttachmentsCardActions />
                          </div>
                        </>
                      )}
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
