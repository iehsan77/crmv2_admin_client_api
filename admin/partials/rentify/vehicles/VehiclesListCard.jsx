"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast"; // ✅ Added import
import { Card, CardContent } from "@/components/ui/card";
import { Car } from "lucide-react";

import Link from "next/link";

import SegmentedToggle from "@/components/FormFields/SegmentedToggle";
import VehiclesActionButtons from "@/partials/rentify/vehicles/VehiclesActionButtons";

import { getKeyFromData } from "@/helper/GeneralFunctions";
import {
  VEHICLES_SEATS,
  VEHICLES_STATUS,
  VEHICLES_TRANSMISSIONS,
} from "@/constants/rentify_constants";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import { Badge } from "@/components/ui/badge";

export default function VehiclesListCard({ vehicle }) {
  const [satus, setStatus] = useState(vehicle?.active); // 1: Active, 0: Inactive

  const { updateVehicle } = useVehiclesStore();

  const handleStatusChange = async (value) => {
    setStatus(value);

    try {
      const body = {
        id: vehicle?.id,
        active: value,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.vehicles?.changeActiveStatus,
        body
      );

      if (response?.status === 200) {
        toast.success(response?.message);
        setStatus(value);
        const updatedVehicle = {
          ...vehicle,
          active: value,
        };
        updateVehicle(updatedVehicle);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Status change failed:", error);
      toast.error("Failed to update vehicle status");
    }
  };

  //console.log("vehicle 48"); console.log(vehicle);

  return (
    <Card className="w-full rounded-2xl border p-4 bg-white">
      <CardContent className="px-0 flex flex-col gap-4 md:flex-row md:items-center justify-between">
        {/* Car Image and Info */}
        <div className="flex items-center gap-4 grow min-w-[400px] max-w-[400px]">
          <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
            <Image
              src={
                vehicle?.old_thumbnails?.length > 0
                  ? vehicle?.old_thumbnails[0]?.url
                  : "/placeholder-car.png" // ✅ Safe fallback
              }
              alt={vehicle?.title || "Vehicle image"}
              width={140}
              height={80}
              className="rounded-xl h-24 object-cover"
            />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">
              #{vehicle?.vehicle_uid ?? "--"}
            </p>
            <h3 className="text-base font-semibold text-primary hover:underline cursor-pointer truncate">
              <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
                {vehicle?.title ?? "Untitled Vehicle"}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              {vehicle?.body_type_details?.title ?? "--"}
            </p>
            <p className="text-xs text-muted-foreground">
              Status:{" "}
              <span className="text-black">{getKeyFromData(VEHICLES_STATUS, vehicle?.status_id)}</span>
            </p>
            {Number(vehicle?.affiliate_id) > 0 && (
              <p className="text-sm text-muted-foreground">
                Affiliation:{" "}
                <Link
                  href={ADMIN_PATHS?.RENTIFY?.AFFILIATES?.VIEW(
                    vehicle?.affiliate_id
                  )}
                  target="_blank"
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  {vehicle?.affiliate_details?.is_company
                    ? vehicle?.affiliate_details?.company_name
                    : `${vehicle?.affiliate_details?.first_name ?? ""} ${
                        vehicle?.affiliate_details?.last_name ?? ""
                      }`}
                </Link>
              </p>
            )}
            <div>
              {vehicle?.expired_documents?.length && (
                vehicle?.expired_documents.map((item)=>{
                  return <Badge variant="destructive" className="me-1">{item}</Badge>
                })
              )}
              {vehicle?.close_to_expiry_documents?.length && (
                vehicle?.close_to_expiry_documents.map((item)=>{
                  return <Badge className="bg-blue-500 text-white me-1">{item}</Badge>
                })
              )}
            </div>
          </div>
        </div>

        {/* Car Details */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground justify-start md:justify-between md:basis-3xs">
          <div className="flex items-center gap-2 max-w-28">
            <Car className="w-5 h-5 shrink-0" />
            <span>
              {getKeyFromData(
                VEHICLES_TRANSMISSIONS,
                vehicle?.transmission_type_id
              ) ?? "--"}
            </span>
          </div>
          <div className="flex items-center gap-2 max-w-28">
            <Car className="w-5 h-5 shrink-0" />
            <span>
              {getKeyFromData(VEHICLES_SEATS, vehicle?.seats) ?? "--"}
            </span>
          </div>
        </div>

        {/* Status Toggle */}
        <SegmentedToggle
          value={vehicle?.active}
          onChange={handleStatusChange}
          options={[
            { label: "Off", value: 0 },
            { label: "On", value: 1 },
          ]}
        />

        {/* Rent */}
        <div className="text-center min-w-[100px]">
          <p className="text-sm text-muted-foreground">Rent</p>
          <p className="text-primary font-semibold">
            AED {vehicle?.rent_price ?? 0}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <VehiclesActionButtons vehicle={vehicle} />
        </div>
      </CardContent>
    </Card>
  );
}
