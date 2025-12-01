"use client";

import { useState, useEffect } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import {
  VEHICLES_AVAILABLE_FILTERS,
  VEHICLES_INITIAL_FILTERS,
  VEHICLES_STATUS,
  LAST_ACTIVITY,
  VEHICLES_TRANSMISSIONS,
  VEHICLES_SEATS,
  VEHICLES_FUEL_TYPES,
} from "@/constants/rentify_constants";

import { useDrawer } from "@/context/drawer-context";
import {
  useVehiclesFiltersStore,
  useVehiclesViewTabsStore,
} from "@/stores/rentify/useVehiclesStore";

import useBrandsStore from "@/stores/rentify/useBrandsStore";
import useModelsStore from "@/stores/rentify/useModelsStore";
import useVariantsStore from "@/stores/rentify/useVariantsStore";

import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";
import NumberInput from "@/components/FormFields/NumberInput";

const VehiclesFilterForm = ({ isDrawer = false }) => {
  const { showDrawer } = useDrawer();
  const {
    filters,
    setFilters,
    setActiveFilter,
    updateValue,
    values,
    getPayload,
  } = useVehiclesFiltersStore();

  const { activeTab } = useVehiclesViewTabsStore();
  const { fetchVehicles, setPage } = useVehiclesStore();

  const { fetchBrands, getUsedBrands } = useBrandsStore();
  const { getModelsByBrandIds, fetchModels } = useModelsStore();
  const { getVariantsByBrandAndModelIds, fetchVariants } = useVariantsStore();

  const [vehicleFilteredModels, setVehicleFilteredModels] = useState([]);
  const [vehicleFilteredVariants, setVehicleFilteredVariants] = useState([]);

  /** ✅ Fetch all data on mount */
  useEffect(() => {
    fetchBrands();
    fetchModels();
    fetchVariants();

    setFilters(VEHICLES_INITIAL_FILTERS);
    setActiveFilter(VEHICLES_INITIAL_FILTERS[0].value);
  }, [fetchBrands, fetchModels, fetchVariants]);
  /*
  useEffect(() => {
    if (filters.length === 0) {
      setFilters(VEHICLES_INITIAL_FILTERS);
      setActiveFilter(VEHICLES_INITIAL_FILTERS[0].value);
    }
  }, [filters.length, setFilters, setActiveFilter]);
  
  const updateModelsDropdown = () => {
    const payload = getPayload();
    const brandIds = payload?.brand_id?.map((b) => Number(b.value)) || [];
    if (brandIds.length > 0) {
      const models = getModelsByBrandIds(brandIds);
      setVehicleFilteredModels(models || []);
    } else {
      setVehicleFilteredModels([]);
  }
};

const updateVariantsDropdown = () => {
    const payload = getPayload();
    const brandIds = payload?.brand_id?.map((b) => Number(b.value)) || [];
    const modelIds = payload?.model_ids?.map((m) => Number(m.value)) || [];
    
    if (modelIds.length > 0) {
      const variants = getVariantsByBrandAndModelIds(brandIds, modelIds);
      setVehicleFilteredVariants(variants || []);
    } else {
      setVehicleFilteredVariants([]);
  }
};
*/


const updateModelsDropdown = () => {
  const payload = getPayload();
  const brandId = Number(payload?.brand_id?.value) || null;

  if (brandId) {
    const models = getModelsByBrandIds([brandId]); // send array
    setVehicleFilteredModels(models || []);
  } else {
    setVehicleFilteredModels([]);
    updateValue("model_id", null);
    updateValue("variant_id", null);
  }
};
const updateVariantsDropdown = () => {
  const payload = getPayload();
  const brandId = Number(payload?.brand_id?.value) || null;
  const modelId = Number(payload?.model_id?.value) || null;

  if (brandId && modelId) {
    const variants = getVariantsByBrandAndModelIds([brandId], [modelId]); // send arrays
    setVehicleFilteredVariants(variants || []);
  } else {
    setVehicleFilteredVariants([]);
    updateValue("variant_id", null);
  }
};




  const filterMapValues = filters.map((f) => f.value);

  /** ✅ Handle Search */
  const handleSearch = async () => {
    const payload = getPayload();

    console.log("payload 108");
    console.log(payload);
    /*
    const body = {
      view: activeTab,
      brand_id: payload?.brand_id?.map((b) => b.value) ?? "",
      model_ids: payload?.model_ids?.map((m) => m.value) ?? "",
      variant_ids: payload?.variant_ids?.map((v) => v.value) ?? "",
      status_id: payload?.active?.value ?? "",
      last_activity: payload?.last_activity?.value ?? "",
      seats: payload?.seats?.value ?? "",
      fuel_type_id: payload?.fuel_type_id?.value ?? "",
      transmission_type_id: payload?.transmission_type_id?.value ?? "",
      rent_price: payload?.rent_price ?? "",
      vehicle_id: payload?.vehicle_id ?? "",
      force: true,
    };

    const body = {
      view: activeTab,
      brand_id: payload?.brand_id?.length
        ? JSON.stringify(payload.brand_id.map((b) => b.value))
        : "",
      model_ids: payload?.model_ids?.length
        ? JSON.stringify(payload.model_ids.map((m) => m.value))
        : "",
      variant_ids: payload?.variant_ids?.length
        ? JSON.stringify(payload.variant_ids.map((v) => v.value))
        : "",
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


*/

    const body = {
      view: activeTab,
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

    console.log("body 126");
    console.log(body);
    setPage(1)
    await fetchVehicles(body);
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("vehicle_id") && (
        <span>
          <TextInput
            label="Vehicle ID"
            value={values.vehicle_id}
            onChange={(e) => updateValue("vehicle_id", e.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("title") && (
        <span>
          <TextInput
            label="Vehicle Name"
            value={values.title}
            onChange={(e) => updateValue("title", e.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("rent_price") && (
        <span>
          <NumberInput
            label="Rent Price"
            value={values.rent_price}
            onChange={(e) => updateValue("rent_price", e.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("brand_id") && (
        <span>
          <DropdownFilter
            label="Brand"
            options={getDropdownFormattedData(getUsedBrands())}
            value={values.brand_id}
            onChange={(val) => {
              updateValue("brand_id", val);
              updateModelsDropdown();
            }}
          />
        </span>
      )}

      {filterMapValues.includes("model_id") && (
        <span>
          <DropdownFilter
            label="Model"
            options={getDropdownFormattedData(vehicleFilteredModels)}
            value={values.model_id}
            onChange={(val) => {
              updateValue("model_id", val);
              updateVariantsDropdown();
            }}
          />
        </span>
      )}

      {filterMapValues.includes("variant_id") && (
        <span>
          <DropdownFilter
            label="Variant"
            options={getDropdownFormattedData(vehicleFilteredVariants)}
            value={values.variant_id}
            onChange={(val) => updateValue("variant_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("status_id") && (
        <span>
          <DropdownFilter
            label="Status"
            options={VEHICLES_STATUS}
            value={values.status_id}
            onChange={(val) => updateValue("status_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("last_activity") && (
        <span>
          <DropdownFilter
            label="Last Activity"
            options={LAST_ACTIVITY}
            value={values.last_activity}
            onChange={(val) => updateValue("last_activity", val)}
          />
        </span>
      )}

      {filterMapValues.includes("transmission_type_id") && (
        <span>
          <DropdownFilter
            label="Transmission Type"
            options={VEHICLES_TRANSMISSIONS}
            value={values.transmission_type_id}
            onChange={(val) => updateValue("transmission_type_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("seats") && (
        <span>
          <DropdownFilter
            label="Seats"
            options={VEHICLES_SEATS}
            value={values.seats}
            onChange={(val) => updateValue("seats", val)}
          />
        </span>
      )}

      {filterMapValues.includes("fuel_type_id") && (
        <span>
          <DropdownFilter
            label="Fuel Type"
            options={VEHICLES_FUEL_TYPES}
            value={values.fuel_type_id}
            onChange={(val) => updateValue("fuel_type_id", val)}
          />
        </span>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {filters.length > 0 && (
          <>
            <Button size="lg" onClick={handleSearch}>
              Search <Search className="ml-2 w-4 h-4" />
            </Button>
            <ClearFiltersByReload />
          </>
        )}
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-sm text-muted-foreground ml-2"
          onClick={() =>
            showDrawer({
              title: "Apply Filters",
              size: "xl",
              content: (
                <DrawerContent availableFilters={VEHICLES_AVAILABLE_FILTERS} />
              ),
            })
          }
        >
          More Filters <Menu className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default VehiclesFilterForm;

/** ✅ Drawer Content Component */
function DrawerContent({ availableFilters }) {
  const { filters, addFilter, removeFilter, getMaxFilters } =
    useVehiclesFiltersStore();
  const maxFilters = getMaxFilters();
  const isLimitReached = filters.length >= maxFilters;

  return (
    <div className="py-4 space-y-6">
      {/* Current Filters */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Current Filters</h3>
        <div className="flex flex-col flex-wrap gap-2">
          {filters.map((filter) => (
            <CheckboxInput
              key={filter.value}
              title={filter.label}
              checked={true}
              onChange={(e) => !e.target.checked && removeFilter(filter.value)}
            />
          ))}
          {filters.length === 0 && (
            <span className="text-xs text-gray-400">No filters selected</span>
          )}
        </div>
      </div>

      {/* Available Filters */}
      <div className="space-y-4">
        {availableFilters.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium mb-2">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = filters.some(
                  (f) => f.value === option.value
                );
                return (
                  <CheckboxInput
                    key={option.value}
                    title={option.label}
                    checked={isSelected}
                    disabled={!isSelected && isLimitReached}
                    onChange={(e) => {
                      if (e.target.checked) addFilter(option);
                      else removeFilter(option.value);
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isLimitReached && (
        <p className="text-xs text-orange-500">
          Maximum {maxFilters} filters allowed. Please remove one to add
          another.
        </p>
      )}
    </div>
  );
}
