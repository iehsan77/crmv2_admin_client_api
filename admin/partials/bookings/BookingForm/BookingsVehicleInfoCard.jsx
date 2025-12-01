"use client";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import React from "react";

const VehicleBookingInfoCard = ({ record }) => {
  return (
    <Card className="p-2  mb-4">
      <div className="flex gap-3">
        <div className="relative w-18 h-18 bg-gray-300 rounded-md">
          <Image
            src="/images/carplaceholder.jpg"
            alt="Car"
            // width={96}
            // height={96}
            fill
            className="w-full h-full object-cover rounded-md"
          />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="flex flex-col justify-around gap-1">
            <p className="text-sm font-semibold truncate">
              Booking ID:{" "}
              <span className="font-bold">{record?.booking_uid || "-"}</span>
            </p>
            <p className="text-sm font-semibold truncate">
              Customer Name:{" "}
              <span className="font-bold">
                {record?.customer_details?.first_name}{" "}
                {record?.customer_details?.last_name}
              </span>
            </p>
            <p className="text-sm font-semibold truncate">
              Vehicle Details:{" "}
              <span className="font-bold">
                {record?.vehicle_details?.title || "-"}
              </span>
            </p>
          </div>
          <div className="flex flex-col justify-around items-end gap-1">
            <p className="text-sm font-semibold truncate">
              Booking Value:{" "}
              <span className="font-bold">
                {record?.total_rent_amount || "-"}
              </span>
            </p>
            <p className="text-sm font-semibold truncate">
              Security Deposit:{" "}
              <span className="font-bold">
                {record?.security_deposit || "-"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VehicleBookingInfoCard;
