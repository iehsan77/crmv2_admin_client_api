"use client"; 
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PageSubTitle } from "@/components/PageTitle";
import CategoryForm from "../../CategoryForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import useVendorStore from "@/stores/ecommerce/useVendorStore";

import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { GET } from "@/helper/ServerSideActions";

const Page = () => {
  // BRAND INFORMATION
  const { vendor, loading } = useVendorStore();
  const vendor_website_id = vendor?.vendor_website_id;


  const params = useParams(); // ✅ Unwraps params in Next.js App Router
  const id = params?.id;
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !vendor_website_id) return;

      try {
        const getRecordUrl = ecom_endpoints.products.categories.getRecord(
          id,
          vendor_website_id
        );
        const response = await GET(getRecordUrl);
        if (response?.status === 200 || response?.status === 201) {
          setRecord(response?.data);
        } else {
          handleResponse(response);
        }
      } catch (error) {
        console.error("Error fetching product record:", error);
      }
    };

    fetchRecord();
  }, [id, vendor_website_id]);

  return (
    // Added return here
    <div>
      <PageSubTitle title="Category - Edit">
        <Link href="/categories">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <CategoryForm record={record} />
    </div>
  );
};

export default Page;
