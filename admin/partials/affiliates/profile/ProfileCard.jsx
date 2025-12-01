"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import ProfileHeader from "./ProfileHeader";
import ProfileActions from "./ProfileActions";
import ProfileDetails from "./ProfileDetails";


import useAffiliateStore from "@/stores/rentify/affiliates/useAffiliateStore";

export default function ProfileCard() {
  const { id } = useParams();

  const { affiliate, fetchAffiliate } = useAffiliateStore();

  useEffect(() => {
    fetchAffiliate(id);
  }, [id, fetchAffiliate]);
  /*
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const response = await GET(
          rentify_endpoints?.rentify?.affiliates?.getDetails(id)
        );


        if (response?.status === 200 && response?.data) {
          setRecord(response?.data);
        } else {
          toast.error("Affiliate not found. Redirecting...");
          setTimeout(() => router.back(), 2000);
        }
      } catch (err) {
        toast.error("An error occurred while fetching the Call.");
        setTimeout(() => router.back(), 2000);
      }
    };
    fetchCall();
  }, [id, router]);
*/
  return (
    <Card className="w-72 h-full rounded-lg shadow-md border p-0 flex flex-col">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Header */}
        <ProfileHeader affiliate={affiliate?.profile} />

        {/* Actions */}
        <ProfileActions affiliate={affiliate?.profile} />
        <hr className="mx-4" />

        {/* Scrollable Details */}
        <div className="flex-1 overflow-y-auto">
          <ProfileDetails affiliate={affiliate?.profile} />
        </div>
      </CardContent>
    </Card>
  );
}
