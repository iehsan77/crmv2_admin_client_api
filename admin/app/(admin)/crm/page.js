"use client";

import { PageSubTitle } from "@/components/PageTitle";

import CrmDashboard from "@/partials/dashboards/CrmDashboard";
import CrmButtons from "@/components/Dashboard/CrmButtons";

export default function Dashboard() {
  return (
    <>
      <PageSubTitle title="Crm Dashboard">
        <CrmButtons />
      </PageSubTitle>
      <CrmDashboard />
    </>
  );
}
