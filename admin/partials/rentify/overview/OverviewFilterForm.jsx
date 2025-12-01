"use client";
import { useState, useEffect } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import { useForm } from "react-hook-form";

import {
  OVERVIEW_AVAILABLE_FILTERS,
  OVERVIEW_INITIAL_FILTERS,
} from "@/constants/rentify_constants";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LayoutGrid, ListFilter, Table } from "lucide-react";

import { useDrawer } from "@/context/drawer-context";
import {
  useVehiclesFiltersStore,
  useVehiclesViewTabsStore,
} from "@/stores/rentify/useVehiclesStore";

import useBrandsStore from "@/stores/rentify/useBrandsStore";
import useModelsStore from "@/stores/rentify/useModelsStore";
import useVariantsStore from "@/stores/rentify/useVariantsStore";

import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import useOverviewStore from "@/stores/rentify/useOverviewStore";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const OverviewFilterForm = ({ isDrawer = false }) => {
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

  const { viewMode, setViewMode } = useOverviewStore();

  const viewOptions = [
    { value: "table", label: "Table", icon: Table },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];
  const selectedView = viewOptions.find((v) => v.value === viewMode);
  const { showDrawer, hideDrawer } = useDrawer();

  /** ✅ Fetch all data on mount (remain same) */
  useEffect(() => {
    fetchBrands();
    fetchModels();
    fetchVariants();

    if (filters.length === 0) {
      setFilters(OVERVIEW_INITIAL_FILTERS);
      setActiveFilter(OVERVIEW_INITIAL_FILTERS[0].value);
    }
  }, [fetchBrands, fetchModels, fetchVariants]);

  /*
  const updateModelsDropdown = () => {
    setVehicleFilteredModels([]);
    const filterFormValues = getPayload();
    const selectedBrands = filterFormValues?.brand_id
      ? filterFormValues?.brand_id
      : [];
    const brandIds = selectedBrands.map((brand) => Number(brand.value));
    if (brandIds.length > 0) {
      const models = getModelsByBrandIds(brandIds);
      setVehicleFilteredModels(models || []);
    }
  };
  const updateVariantsDropdown = () => {
    setVehicleFilteredVariants([]);
    const filterFormValues = getPayload();

    const selectedBrands = filterFormValues?.brand_id
      ? filterFormValues?.brand_id
      : [];
    const brandIds = selectedBrands.map((brand) => Number(brand.value));

    const selectedModels = filterFormValues?.model_id
      ? filterFormValues?.model_id
      : [];
    const modelIds = selectedModels.map((model) => Number(model.value));
    if (modelIds.length > 0) {
      const variants = getVariantsByBrandAndModelIds(brandIds, modelIds);

      setVehicleFilteredVariants(variants || []);
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

  const handleSearch = async () => {
    const payload = getPayload();

console.log("overviw payload")
console.log(payload)


    const body = {
      view: activeTab,
      brand_id: payload?.brand_id?.value || "",
      model_id: payload?.model_id?.value || "",
      variant_id: payload?.variant_id?.value || "",
      force: true,
    };
    setPage(1);


console.log("body 157")
console.log(body)


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
      {filterMapValues.includes("brand_id") && (
        <DropdownFilter
          label="Brand"
          options={getDropdownFormattedData(getUsedBrands())}
          value={values.brand_id}
          onChange={(val) => {
            updateValue("brand_id", val);
            updateModelsDropdown();
          }}
        />
      )}

      {filterMapValues.includes("model_id") && (
        <DropdownFilter
          label="Model"
          options={getDropdownFormattedData(vehicleFilteredModels)}
          value={values.model_id}
          onChange={(val) => {
            updateValue("model_id", val);
            updateVariantsDropdown();
          }}
        />
      )}

      {filterMapValues.includes("variant_id") && (
        <DropdownFilter
          label="Variant"
          options={getDropdownFormattedData(vehicleFilteredVariants)}
          value={values.variant_id}
          onChange={(val) => updateValue("variant_id", val)}
        />
      )}

      <div className="flex items-center gap-2 ml-auto">
        {filters.length > 0 && (
          <>
            <Button size="lg" onClick={handleSearch}>
              Search
              <Search />
            </Button>
            <ClearFiltersByReload />
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2 bg-transparent"
            >
              {selectedView?.icon && <selectedView.icon className="w-4 h-4" />}
              {/* {selectedView?.label} */}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup
              value={viewMode}
              onValueChange={setViewMode}
            >
              {viewOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  className="flex items-center gap-2"
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/*        
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-sm text-muted-foreground ml-2"
          onClick={() =>
            showDrawer({
              title: "Apply Filters",
              size: "xl",
              content: <DrawerContent availableFilters={OVERVIEW_AVAILABLE_FILTERS} />,
            })
          }
        >
          More Filters
          <Menu className="w-4 h-4" />
        </Button>
      */}
      </div>
    </div>
  );
};

export default OverviewFilterForm;

function DrawerContent({ availableFilters }) {
  const { filters, addFilter, removeFilter, getMaxFilters } =
    useVehiclesFiltersStore();
  const maxFilters = getMaxFilters();
  const isLimitReached = filters.length >= maxFilters;

  return (
    <div className="py-4 space-y-6">
      {/* Current Views */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Current Filters</h3>
        <div className="flex flex-col flex-wrap gap-2">
          {filters.map((filter) => (
            <CheckboxInput
              key={filter.value}
              title={filter.label}
              checked={true}
              onChange={(e) => {
                if (!e.target.checked) {
                  removeFilter(filter.value);
                }
              }}
            />
          ))}
          {filters.length === 0 && (
            <span className="text-xs text-gray-400">No views selected</span>
          )}
        </div>
      </div>

      {/* Available Views */}
      <div className="space-y-4">
        {availableFilters.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium mb-2">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = filters.some(
                  (t) => t.value === option.value
                );
                return (
                  <CheckboxInput
                    key={option.value}
                    title={option.label}
                    checked={isSelected}
                    disabled={!isSelected && isLimitReached}
                    onChange={(e) => {
                      if (e.target.checked) {
                        addFilter(option);
                      } else {
                        removeFilter(option.value);
                      }
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
          Maximum {maxFilters} views allowed. Please remove one to add another.
        </p>
      )}
    </div>
  );
}
