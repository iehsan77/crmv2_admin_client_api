import { Suspense } from "react";

import { GET } from "@/helper/ServerSideActions";
import Loader from "@/components/Loader";
import MultiImageBannerForm from "@/partials/banner/MultiImageBannerForm";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { PageSubTitle } from "@/components/PageTitle";

import Link from "next/link";

const Page = async ({ params }) => {
  const { id } = await params;
  const res = await GET(ecom_endpoints.BANNER.UPDATE_MULTI_BANNER(id));

  return (
    <>
      <PageSubTitle title="Banner Management - Update">
        <Link
          href={ADMIN_PATHS?.BANNER?.ROOT}
          className="block text-center font-semibold rounded-md px-3 py-[5px] bg-gray-800 text-white border border-gray-800 transition-all duration-300 hover:bg-transparent hover:text-gray-800"
        >
          View All
        </Link>
      </PageSubTitle>
      <Suspense fallback={<Loader />}>
        <MultiImageBannerForm currentData={res?.data} />
      </Suspense>
    </>
  );
};

export default Page;
