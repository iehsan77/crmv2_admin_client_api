"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/partials/rentify/vehicle-detail/ImageGallery";
import CarHeader from "@/partials/rentify/vehicle-detail/CarHeader";
import CarDetailsCard from "@/partials/rentify/vehicle-detail/CarDetailsCard";
import SpecificationsCard from "@/partials/rentify/vehicle-detail/SpecificationsCard";
import CarRentStats from "@/partials/rentify/vehicle-detail/CarRentStats";
import FinancialStats from "@/partials/rentify/vehicle-detail/FinancialStats";
import CarFeaturesCard from "@/partials/rentify/vehicle-detail/CarFeaturesCard";
import RecentActivityCard from "@/components/RecentActivityCard";
import ChartsLineChart from "@/components/ChartsLineChart";
import { useDrawer } from "@/context/drawer-context";
import InsuranceInformation from "@/partials/rentify/vehicle-detail/InsuranceInformation";


export default function Page() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const { hideDrawer } = useDrawer();

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await GET(
          rentify_endpoints?.rentify?.vehicles?.getVehicle(id)
        );

        if (response?.status === 200) {
          setRecord(response?.data);
          toast.success("Vehicle details loaded");
        } else {
          handleResponse(response);
        }
      } catch (error) {
        console.error(error);
      } finally {
        hideDrawer?.();
      }
    };

    if (id) fetchRecord();
  }, [id]); // ✅ only depends on id & hideDrawer

  const images = useMemo(
    () => [
      ...(record?.old_thumbnails?.map((img) => img.url) || []),
      ...(record?.old_images?.map((img) => img.url) || []),
    ],
    [record]
  );

  const breadcrumbItems = [
    { label: "Dashboard", href: ADMIN_PATHS?.RENTIFY?.OVERVIEW },
    { label: "Vehicles", href: ADMIN_PATHS?.RENTIFY?.VEHICLES?.ROOT },
    { label: record?.title || "Loading..." }, // ✅ safe fallback
  ];

  return (
    <div className="px-4 space-y-6 relative">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">
          Vehicle Details
        </h1>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <ImageGallery images={images} />      
      <CarHeader data={record} /> {/* Pending */}
      <CarDetailsCard data={record} />
      <SpecificationsCard data={record} />
      <CarRentStats data={record} />
      <FinancialStats data={record} />
      <InsuranceInformation data={record} />
      <CarFeaturesCard data={record?.feature_details} />      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard data={record?.recent_activity} loading={false} />
        <ChartsLineChart data={record?.activity_chart_data} />
      </div>
    </div>
  );
}


