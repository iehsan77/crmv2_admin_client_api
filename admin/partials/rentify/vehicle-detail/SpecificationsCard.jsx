import Acceleration from "@/public/icons/Acceleration";
import Capacity from "@/public/icons/Capacity";
import Fuel from "@/public/icons/Fuel";
import Transmission from "@/public/icons/Transmission";
import { Palette } from "lucide-react";
import { FaGasPump, FaTachometerAlt } from "react-icons/fa";
import {
  VEHICLES_CONDITIONS,
  VEHICLES_COLORS,
  VEHICLES_FUEL_TYPES,
  VEHICLES_SEATS,
  VEHICLES_TRANSMISSIONS,
} from "@/constants/rentify_constants";

export default function SpecificationsCard({ data }) {
  const specs = [
    {
      icon: Transmission,
      label: "Transmission",
      value:
        VEHICLES_TRANSMISSIONS?.find(
          (t) => t?.value == data?.transmission_type_id
        )?.label || "",
    },
    {
      icon: Capacity,
      label: "Number of Seats",
      value: `${data?.seats} seats`,
    },
    {
      icon: Fuel,
      label: "Fuel Tank Range",
      value: `${data?.fuel_tank_range} Km on full tank`,
    },
    {
      icon: Fuel,
      label: "Fuel Type",
      value:
        VEHICLES_FUEL_TYPES?.find((f) => f?.value == data?.fuel_type_id)
          ?.label || "",
    },
    {
      icon: FaTachometerAlt,
      label: "Top Speed",
      value: `${data?.top_speed} Km/h`,
    },
    {
      icon: Acceleration,
      label: "Acceleration",
      value: `${data?.acceleration} seconds (0-120 Km/h)`,
    },
    {
      icon: FaGasPump,
      label: "Mileage",
      value: `${data?.mileage} Km/l`,
    },
    {
      icon: Palette,
      label: "Exterior Color",
      value:
        VEHICLES_COLORS?.find((c) => c?.value == data?.exterior_color_id)
          ?.label || "",
    },
    {
      icon: Palette,
      label: "Interior Color",
      value:
        VEHICLES_COLORS?.find((c) => c?.value == data?.interior_color_id)
          ?.label || "",
    },
  ];

  return (
    <div>
      <h3 className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
        Specifications
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {specs.map((item, i) => (
          <div key={i} className="p-2 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <item.icon
                className="text-primary"
                width={24}
                height={24}
                size={24}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-medium">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}