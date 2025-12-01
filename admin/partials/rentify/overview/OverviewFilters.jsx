"use client";

import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import OverviewViewsTabs from "./OverviewViewsTabs";
import OverviewFilterForm from "./OverviewFilterForm";

import {
  OVERVIEW_AVAILABLE_VIEWS,
  OVERVIEW_INITIAL_VIEWS,
} from "@/constants/rentify_constants";
import useVehiclesStore, {
  useVehiclesFiltersStore,
  useVehiclesViewTabsStore,
} from "@/stores/rentify/useVehiclesStore";

const OverviewFilters = () => {
  const { showDrawer } = useDrawer();
  const { fetchVehicles, setPage } = useVehiclesStore();

  const { getPayload } = useVehiclesFiltersStore();
  const { activeTab } = useVehiclesViewTabsStore();

  const loadDataByView = async (view) => {
    const payload = getPayload();
    setPage(1);
    const body = {
      view: view,
      brand_id: payload?.brand_id?.value || "",
      model_id: payload?.model_id?.value || "",
      variant_id: payload?.variant_id?.value || "",
      force: true,
    };
    await fetchVehicles(body);
  };

  return (
    <>
      <OverviewViewsTabs
        availableTabs={OVERVIEW_AVAILABLE_VIEWS}
        initialTabs={OVERVIEW_INITIAL_VIEWS}
        onTabChange={loadDataByView}
        showAddView={false}
        allowClose={false}
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
              content: <OverviewFilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop form */}
      <div className="hidden lg:block">
        <OverviewFilterForm />
      </div>
    </>
  );
};

export default OverviewFilters;
