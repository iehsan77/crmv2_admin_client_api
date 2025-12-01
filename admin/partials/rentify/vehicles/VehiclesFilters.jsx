"use client";

import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import VehiclesViewsTabs from "./VehiclesViewsTabs";
import VehiclesFilterForm from "./VehiclesFilterForm";

import {
  VEHICLES_AVAILABLE_VIEWS,
  VEHICLES_INITIAL_VIEWS,
} from "@/constants/rentify_constants";
import useVehiclesStore, {
  useVehiclesFiltersStore,
} from "@/stores/rentify/useVehiclesStore";

const VehiclesFilters = () => {
  const { showDrawer } = useDrawer();
  const { fetchVehicles, setPage } = useVehiclesStore();

  const { getPayload } = useVehiclesFiltersStore();

  const loadDataByView = async (view) => {
    const payload = getPayload();
    const body = {
      view: view,
      brand_id: payload?.brand_id?.value || "",
      model_id: payload?.model_id?.value || "",
      variant_id: payload?.variant_id?.value || "",

      title: payload?.title || "",
      status_id: payload?.status_id?.value || "",
      last_activity: payload?.last_activity?.value || "",
      seats: payload?.seats?.value || "",
      fuel_type_id: payload?.fuel_type_id?.value || "",
      transmission_type_id: payload?.transmission_type_id?.value || "",
      rent_price: payload?.rent_price || "",
      vehicle_id: payload?.vehicle_id || "",
      force: true,
    };

    setPage(1);
    await fetchVehicles(body);
  };

  return (
    <>
      <VehiclesViewsTabs
        availableTabs={VEHICLES_AVAILABLE_VIEWS}
        initialTabs={VEHICLES_INITIAL_VIEWS}
        onTabChange={loadDataByView}
      />

      {/* Mobile filter button */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open filters"
          onClick={() =>
            showDrawer({
              title: "Filter Cars",
              size: "xl",
              content: <VehiclesFilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop form */}
      <div className="hidden lg:block">
        <VehiclesFilterForm />
      </div>
    </>
  );
};

export default VehiclesFilters;
