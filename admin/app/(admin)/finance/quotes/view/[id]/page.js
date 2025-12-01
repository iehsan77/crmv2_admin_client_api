"use client"; 
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import { toast } from "sonner";

import { GET } from "@/helper/ServerSideActions";

import PrintTemplate from "@/app/(admin)/finance/quotes/relatedFiles/printTemplate";

const QuotationPage = () => {



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
              if(response?.data){
                setRecord(response?.data);
              }else{
                toast.error("Sorry record not found")
                router.push(ADMIN_PATHS?.FINANCE?.QUOTES?.LIST);
              }
            } else {
              handleStatusCode(response);
            }
          } catch (error) {
            console.error("Error fetching product record:", error);
          }
        };
    
        fetchRecord();
      }, [id, getRecordUrl, router]);






  return (
    <div>
      <PrintTemplate record={record} />
    </div>
  );
};

export default QuotationPage;
