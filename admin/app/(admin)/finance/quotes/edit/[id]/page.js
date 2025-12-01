"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { PageSubTitle } from "@/components/PageTitle";
import Form from "@/app/(admin)/finance/quotes/relatedFiles/Form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import { GET } from "@/helper/ServerSideActions";

import { handleResponse } from "@/helper/ClientSideActions";

const Page = () => {
  // BRAND INFORMATION -  starting
  const router = useRouter();
  // BRAND INFORMATION -  ending

  const params = useParams(); // ✅ Unwraps params in Next.js App Router
  const id = params?.id;
  const [record, setRecord] = useState(null);

  const getRecordUrl = ecom_endpoints.products.quotes.getRecord(id);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;

      try {
        const response = await GET(getRecordUrl);

        if (response?.status === 200) {
          if (response?.data) {
            setRecord(response?.data);
          } else {
            router.push(ADMIN_PATHS?.FINANCE?.QUOTES?.LIST);
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
    <div className="w-full">
      <PageSubTitle title="Quotation - Edit">
        <Link href={ADMIN_PATHS?.FINANCE?.QUOTES?.LIST}>
          <Button className="text-nowrap" variant="outline">
            View All
          </Button>
        </Link>
      </PageSubTitle>
      <Form record={record} />
    </div>
  );
};

export default Page;
