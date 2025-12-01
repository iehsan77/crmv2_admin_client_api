"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { PageSubTitle } from "@/components/PageTitle";
import Form from "../../relatedFiles/Form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import { GET } from "@/helper/ServerSideActions";

const Page = () => {
  // BRAND INFORMATION -  starting
  const router = useRouter();
  // BRAND INFORMATION -  ending

  const params = useParams(); // ✅ Unwraps params in Next.js App Router
  const id = params?.id;
  const [record, setRecord] = useState(null);

  const getRecordUrl = ecom_endpoints.products.salesOrders.getRecord(id);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;

      try {
        const response = await GET(getRecordUrl);

        if (response?.status === 200) {
          if (response?.data) {
            setRecord(response?.data);
          } else {
            router.push(ADMIN_PATHS?.ECOMMERCE?.ORDERS?.LIST);
          }
        } else {
          handleResponse(response);
        }
      } catch (error) {
        console.error("Error fetching product record:", error);
      }
    };

    fetchRecord();
  }, [id, getRecordUrl, router]);

  return (
    // Added return here
    <>
      <PageSubTitle title="Sale Order - Edit">
        <Link href="/orders">
          <Button className="text-nowrap" variant="primary">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <div className="content-container">
        <Form record={record} />
      </div>
    </>
  );
};

export default Page;
