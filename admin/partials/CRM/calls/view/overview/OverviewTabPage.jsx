"use client";
import { useEffect, useState, useRef } from "react";
import DataHighlights from "./DataHighlights";
import RelatedAccountsList from "@/partials/crm/common/accounts/RelatedAccountsList";
import RelatedContactsList from "@/partials/crm/common/contacts/RelatedContactsList";
import RelatedDealsList from "@/partials/crm/common/deals/RelatedDealsList";

const OverviewTabPage = ({ profile = [] }) => {

  return (
    <div className="space-y-4">
      <DataHighlights highlights={profile?.highlights} />
      {/* <RelatedAccountsList />
      <RelatedContactsList />
      <RelatedDealsList /> */}
    </div>
  );
};

export default OverviewTabPage;
