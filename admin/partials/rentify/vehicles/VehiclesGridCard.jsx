"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import Transmission from "@/public/icons/Transmission";
import Capacity from "@/public/icons/Capacity";
import Fuel from "@/public/icons/Fuel";
import Button from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "lucide-react";

import { getKeyFromData } from "@/helper/GeneralFunctions";
import {
  VEHICLES_SEATS,
  VEHICLES_TRANSMISSIONS,
  VEHICLES_FUEL_TYPES,
  VEHICLES_STATUS,
} from "@/constants/rentify_constants";

export default function VehiclesGridCard({ vehicle }) {
  return (
    <Card className="rounded-xl shadow-md overflow-hidden">
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">
              #{vehicle?.vehicle_uid}
            </div>
            <h3 className="text-base text-primary font-medium">
              <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
                {vehicle?.title}
              </Link>
            </h3>
            <p className="text-xs text-muted-foreground">
              Body: {vehicle?.body_type_details?.title ?? "--"}
              {Number(vehicle?.affiliate_id) > 0 && (
                <span className="text-sm text-muted-foreground">
                  {" "}
                  | Affiliation:{" "}
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
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Status:{" "}
              <span className="text-black">
                {getKeyFromData(VEHICLES_STATUS, vehicle?.status_id)}
              </span>
            </p>
            <div>
              {vehicle?.expired_documents?.length &&
                vehicle?.expired_documents.map((item) => {
                  return (
                    <Badge variant="destructive" className="me-1">
                      {item}
                    </Badge>
                  );
                })}
              {vehicle?.close_to_expiry_documents?.length &&
                vehicle?.close_to_expiry_documents.map((item) => {
                  return (
                    <Badge className="bg-blue-500 text-white me-1">
                      {item}
                    </Badge>
                  );
                })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-primary text-base font-semibold text-nowrap">
              AED {vehicle?.rent_price ?? 0}
            </span>
            <div className="text-xs text-muted-foreground">/days</div>
          </div>
        </div>

        {/* Image */}
        <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
          <div className="rounded-md overflow-hidden h-40 w-full">
            <Image
              src={
                vehicle?.old_thumbnails?.length > 0
                  ? vehicle?.old_thumbnails[0]?.url
                  : "/placeholder-car.png"
              }
              alt={vehicle?.title || "Car image"}
              width={350}
              height={175}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Availability */}
        {vehicle?.status === "Available" ? (
          <div className="flex items-center mt-2 space-x-2 bg-blue-600/10 w-fit pr-3 rounded-md">
            <Badge>{vehicle?.status}</Badge>
            <span className="text-sm text-primary font-medium">
              {vehicle?.units}
            </span>
          </div>
        ) : (
          <Badge variant="secondary" className="mt-2">
            {vehicle?.status}
          </Badge>
        )}

        {/* Attributes */}
        <div className="w-full">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/10 text-primary rounded-sm">
                <Transmission className="h-6 w-6" />
              </span>
              <div className="text-sm leading-tight hidden sm:block">
                <p className="text-primary">
                  {getKeyFromData(
                    VEHICLES_TRANSMISSIONS,
                    vehicle?.transmission_type_id
                  ) ?? "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="p-1.5 bg-blue-600/10 text-primary rounded-sm">
                <Capacity className="h-6 w-6" />
              </span>
              <div className="text-sm leading-tight hidden sm:block">
                <p className="text-primary">
                  {getKeyFromData(VEHICLES_SEATS, vehicle?.seats) ?? "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600/10 text-primary rounded-sm">
                <Fuel className="h-6 w-6" />
              </span>
              <div className="text-sm leading-tight hidden sm:block">
                <p className="text-primary">
                  {getKeyFromData(VEHICLES_FUEL_TYPES, vehicle?.fuel_type_id) ??
                    "--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <CardFooter className="px-0 pt-4">
          <div className="w-full flex">
            <Link
              href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}
              className="w-full"
            >
              <Button
                size=""
                className="w-full p-5 border border-[#2575D6] bg-[#2575D6]/10 text-primary hover:text-white"
              >
                Select Car
              </Button>
            </Link>

            {/* <Button size="icon" variant="secondary" className="p-5 border">
              <Ellipsis className="h-6 w-6" />
            </Button> */}
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
