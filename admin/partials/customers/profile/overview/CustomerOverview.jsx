"use client";
import DataHighlights from "@/partials/customers/profile/overview/DataHighlights";
import CustomerBookings from "./bookings/CustomerBookings";
import CustomerInvoices from "./invoices/CustomerInvoices";
import CustomerQuotes from "./quotes/CustomerQuotes";
import CustomerAttachements from "./attachements/CustomerAttachements";

const CustomerOverview = () => {

  return (
    <div className="space-y-4">
      <DataHighlights />
      <CustomerBookings />
      <CustomerInvoices />
      <CustomerQuotes />
    </div>
  );
};

export default CustomerOverview;
