"use client";
import VehiclesForm from "@/partials/rentify/vehicles/VehiclesForm";
import { useDrawer } from "@/context/drawer-context";

import Link from "next/link";
import Button from "@/components/Button";
import { Star, Eye, Pencil } from "lucide-react";

import toast from "react-hot-toast";

import { POST, GET } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";

import useVehiclesStore from "@/stores/rentify/useVehiclesStore";

export default function VehiclesActionButtons({ vehicle }) {
  const { showDrawer } = useDrawer();

  const { vehicles, setVehicles } = useVehiclesStore();

  const markAsFavorite = async (id, v) => {
    try {
      const newFav = v === 1 ? 0 : 1;
      const response = await GET(
        rentify_endpoints?.rentify?.vehicles?.favorite(id, newFav)
      );

      //console.log("response 28"); console.log(response); return false;

      if (response?.status === 200) {
        console.log("vehicles 32");
        console.log(vehicles);

        const updatedVehicles = vehicles.map((r) =>
          r.id === id ? { ...r, favorite: newFav } : r
        );

        console.log("updatedVehicles 32");
        console.log(updatedVehicles);

        setVehicles(updatedVehicles);
        toast.success(`Updated favorite status.`);
      } else {
        toast.error("Failed to update favorite status.");
      }
    } catch (err) {
      toast.error("Failed to update favorite.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        title="Favorite"
        onClick={() => markAsFavorite(vehicle?.id, vehicle?.favorite)}
      >
        <Star
          className={`h-4 w-4 ${
            vehicle?.favorite === 1 ? "text-yellow-400" : "text-gray-400"
          }`}
          fill={vehicle?.favorite === 1 ? "currentColor" : "none"}
        />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          showDrawer({
            title: "Add Vehicle",
            size: "xl",
            content: (
              <div className="py-4">
                <VehiclesForm record={vehicle} />
              </div>
            ),
          })
        }
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Link href={ADMIN_PATHS?.RENTIFY?.VEHICLES?.VIEW(vehicle?.id)}>
        <Button variant="outline" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
