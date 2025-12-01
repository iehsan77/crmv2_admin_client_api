"use client";

import { PageSubTitle } from "@/components/PageTitle";
import Image from "next/image";
import CrmButtons from "@/components/Dashboard/CrmButtons";

export default function Dashboard() {
  return (
    <>
      <PageSubTitle title="eCommerce Dashboard">
        <CrmButtons />
      </PageSubTitle>

      <div className="relative w-full h-[100vh] py-4"> {/* Define a height here */}
        <Image
          src="/images/ecommerce_dashboard.png"
          alt="Dashboard"
          fill
          className="object-fil"
        />
      </div>
    </>
  );
}
