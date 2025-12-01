"use client"; // Ensure this runs on the client side

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductTabs from "@/components/ProductTabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageSubTitle } from "@/components/PageTitle";
import ProductForm from "@/app/(admin)/ecommerce/catalog/ProductForm";
import ProductGallery from "@/app/(admin)/ecommerce/catalog/ProductGallery";
import ProductVariations from "@/app/(admin)/ecommerce/catalog/ProductVariations";

import useVendorStore from "@/stores/ecommerce/useVendorStore";


import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { GET } from "@/helper/ServerSideActions";

const Page = () => {
  const params = useParams(); // ✅ Unwraps params in Next.js App Router
  const id = params?.id;

  const { vendor, loading } = useVendorStore();

  // BRAND INFORMATION
  const vendor_website_id = vendor?.vendor_website_id;

  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || !vendor_website_id) return;

      try {
        const getRecordUrl = ecom_endpoints.products.catalog.getRecord(id, vendor_website_id);
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
  }, [id, vendor_website_id]); // Runs when ID or vendor changes

  const tabsData = [
    { label: "General Information", content: <ProductForm record={record} /> },
    { label: "Product Gallery", content: <ProductGallery /> },
    { label: "Product Variations", content: <ProductVariations /> },
  ];

  return (
    <div>
      <PageSubTitle title="Product - Edit">
        <Link href="/ecommerce/catalog">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <ProductTabs tabs={tabsData} />
    </div>
  );
};

export default Page;
