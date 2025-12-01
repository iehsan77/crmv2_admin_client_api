"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import { toast } from "sonner";

import { GET } from "@/helper/ServerSideActions";

import PrintTemplate from "@/app/(admin)/ecommerce/orders/relatedFiles/printTemplate"; // ✅ Capitalized

const ViewPage = () => {
  // BRAND INFORMATION -  starting
  const router = useRouter();
  // BRAND INFORMATION -  ending

  const params = useParams();
  const id = params?.id;
  const [record, setRecord] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchRecord = async () => {
      try {
        const getRecordUrl = ecom_endpoints.products.salesOrders.getRecord(id);

        const response = await GET(getRecordUrl);

        if (response?.status === 200 && response.data) {
          setRecord(response.data);
        } else {
          toast.error("Sorry, record not found");
          router.push("/orders");
        }
      } catch (error) {
        console.error("Error fetching product record:", error);
      }
    };

    fetchRecord();
  }, [id, router]); // ✅ Removed unnecessary dependency

  return (
    <div>
      <PrintTemplate record={record} /> {/* ✅ Fixed Component Name */}
    </div>
  );
};

export default ViewPage;
