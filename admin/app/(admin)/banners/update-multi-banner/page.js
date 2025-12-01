import React from "react";

import MultiImageBannerForm from "@/partials/banner/MultiImageBannerForm";
import { PageSubTitle } from "@/components/PageTitle";
import Link from "next/link";


import { ADMIN_PATHS, PUBLIC_PATHS } from "@/constants/paths"; // adjust path if needed
export default function Page() {
  return (
    <>
      <PageSubTitle title="Banner Management - Multiple">
        <Link
          href={ADMIN_PATHS?.BANNER?.ROOT}
          className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800"
        >
          View All
        </Link>
      </PageSubTitle>
      <MultiImageBannerForm />
    </>
  );
}
