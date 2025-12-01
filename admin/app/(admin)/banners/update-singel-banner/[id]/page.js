import { GET } from "@/helper/ServerSideActions";
import Loader from "@/components/Loader";
import SingelBannerForm from "@/partials/banner/SingelBannerForm";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import React, { Suspense } from "react";

import { PageSubTitle } from "@/components/PageTitle";
import Link from "next/link";

const Page = async ({ params }) => {
  const { id } = await params;
  const res = await GET(ecom_endpoints.BANNER.UPDATE_SINGLE_BANNER(id));
  return (
    <>
      <PageSubTitle title="Banner Management - Sigle Banner">
        <Link
          href={ADMIN_PATHS?.BANNER?.ROOT}
          className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800"
        >
          View All
        </Link>
      </PageSubTitle>
      <Suspense fallback={<Loader />}>
        <SingelBannerForm currentData={res?.data} />
      </Suspense>
    </>
  );
};

export default Page;
