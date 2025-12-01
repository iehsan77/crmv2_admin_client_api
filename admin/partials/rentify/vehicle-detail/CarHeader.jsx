"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDrawer } from "@/context/drawer-context";
import VehiclesForm from "../vehicles/VehiclesForm";
import { useState } from "react";
import { POST } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import toast from "react-hot-toast";
import { handleResponse } from "@/helper/ClientSideActions";
import SegmentedToggle from "@/components/FormFields/SegmentedToggle";

export default function CarHeader({ data = {} }) {
  const { showDrawer } = useDrawer();
  const [status, setStatus] = useState(data?.active ?? 1); // 1: Active, 0: Inactive

  const handleStatusChange = async (value) => {
    setStatus(value);

    try {
      const body = {
        id: data?.id,
        active: value,
      };

      const response = await POST(
        rentify_endpoints?.rentify?.vehicles?.changeActiveStatus,
        body
      );

      if (response?.status === 200) {
        toast.success(response?.message);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Status change failed:", error);
      toast.error("Failed to update vehicle status");
    }
  };

  return (
    <div className="flex justify-between items-start flex-wrap gap-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          {data?.body_type_details?.title}
        </p>
        <h1 className="text-primary text-3xl font-semibold">{data?.title}</h1>
        <h2 className="text-[#777] text-2xl font-semibold">({data?.year})</h2>
        <p className="text-muted-foreground text-sm">
          Car ID - {data?.vehicle_uid}
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          <span className="text-primary me-2">Affiliation:</span>
          {Number(data?.affiliate_id)
            ? data?.affiliate_details?.is_company === 1
              ? data?.affiliate_details?.company_name || "-"
              : `${data?.affiliate_details?.first_name || ""} ${
                  data?.affiliate_details?.last_name || ""
                }`.trim() || "-"
            : "Own"}
        </p>
        {true ? (
          <Badge>Available</Badge>
        ) : (
          <Badge variant="secondary" className="mt-2">
            Unavailable
          </Badge>
        )}
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3">
          {/* Status Toggle */}
          <SegmentedToggle
            value={status}
            onChange={handleStatusChange}
            options={[
              { label: "Off", value: 0 },
              { label: "On", value: 1 },
            ]}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              showDrawer({
                title: "Edit Vehicle",
                size: "xl",
                content: (
                  <div className="py-4">
                    <VehiclesForm record={data} />
                  </div>
                ),
              })
            }
          >
            Edit
          </Button>
        </div>
        <h2 className="text-2xl font-semibold text-primary">
          AED {data?.rent_price}{" "}
          <span className="text-sm text-muted-foreground">/days</span>
        </h2>
      </div>
    </div>
  );
}
