"use client";
import DataHighlights from "./DataHighlights";


import RelatedLeadsList from "@/partials/crm/common/leads/RelatedLeadsList";
import RelatedContactsList from "@/partials/crm/common/contacts/RelatedContactsList";
import RelatedDealsList from "@/partials/crm/common/deals/RelatedDealsList";
import RelatedAccountsList from "@/partials/crm/common/accounts/RelatedAccountsList";
import RelatedInvoicesList from "@/partials/crm/common/invoices/RelatedInvoicesList";
import RelatedQuotesList from "@/partials/crm/common/quotes/RelatedQuotesList";
import RelatedOrdersList from "@/partials/crm/common/orders/RelatedOrdersList";
import RelatedBookingsList from "@/partials/crm/common/bookings/RelatedBookingsList";
import RelatedAttachmentsList from "@/partials/crm/common/attachments/RelatedAttachmentsList";


const OverviewTabPage = ({ profile = [] }) => {

  return (
    <div className="space-y-4">
      <DataHighlights highlights={profile?.highlights} />
      
      <RelatedLeadsList />
      <RelatedContactsList />
      <RelatedDealsList />
      <RelatedAccountsList />
      <RelatedInvoicesList />
      <RelatedQuotesList />
      <RelatedOrdersList />
      <RelatedBookingsList />
      <RelatedAttachmentsList />
    </div>
  );
};

export default OverviewTabPage;
