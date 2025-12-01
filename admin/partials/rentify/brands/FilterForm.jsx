"use client";
import React, { useState, useEffect } from "react";

import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";

import { Search, Eraser } from "lucide-react";
import toast from "react-hot-toast";

import { VEHICLES_STATUS, LAST_ACTIVITY } from "@/constants/rentify_constants";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";

import useCommonStore from "@/stores/useCommonStore";
import useBrandsStore, {
  useBrandsFiltersStore,
} from "@/stores/rentify/useBrandsStore";
import { useDrawer } from "@/context/drawer-context";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";
import NumberInput from "@/components/FormFields/NumberInput";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";

const FilterForm = ({ isDrawer = false }) => {
  const { hideDrawer } = useDrawer();
  const { brands, brandsLoading, fetchBrands, setFilteredBrands } =
    useBrandsStore();

  const { countries, fetchCountries } = useCommonStore();

  const { updateFilterValue, filterValues } = useBrandsFiltersStore();

  // 🔹 Fetch brands + countries
  useEffect(() => {
    fetchCountries();
    fetchBrands();
  }, [fetchCountries, fetchBrands]);

  // 🔹 Submit handler
  const onSubmit = () => {
    const formData = filterValues;

    const body = {
      brand_id: formData?.brand_id ? formData.brand_id.value : "",
      origin_country_id: formData?.origin_country_id
        ? formData.origin_country_id.value
        : "",
      active: formData?.active
        ? formData.active.value
        : "",
      vehicles_units: formData?.vehicles_units,
      //? Number(formData.vehicles_units.value)
      //: null,
      last_activity: formData?.last_activity?.value || "",
    };

    console.log("body 49");
    console.log(body);

    setFilteredBrands(body);
    hideDrawer?.();
  };

  return (
    <div
      // onSubmit={handleSubmit(onSubmit)}
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
      }`}
    >
      <DropdownFilter
        label="Brand"
        options={getDropdownFormattedData(brands)}
        value={filterValues.brand_id}
        onChange={(val) => updateFilterValue("brand_id", val)}
        isLoading={brandsLoading}
      />

      <DropdownFilter
        label="Country of Origin"
        options={getDropdownFormattedData(countries)}
        value={filterValues.origin_country_id}
        onChange={(val) => updateFilterValue("origin_country_id", val)}
      />

      <DropdownFilter
        label="Active"
        options={ACTIVE_OPTIONS}
        value={filterValues.active}
        onChange={(val) => updateFilterValue("active", val)}
      />

      <span>
        <NumberInput
          label="No. of Units"
          value={filterValues.vehicles_units || ""}
          onChange={(val) =>
            updateFilterValue("vehicles_units", val?.target?.value)
          }
        />
      </span>

      <DropdownFilter
        label="Last Activity"
        options={LAST_ACTIVITY}
        value={filterValues.last_activity}
        onChange={(val) => updateFilterValue("last_activity", val)}
      />

      <div className="flex items-center gap-2 ml-auto">
        <Button size="lg" type="submit" onClick={onSubmit}>
          Search
          <Search className="ml-1" size={16} />
        </Button>
        <ClearFiltersByReload />
      </div>
    </div>
  );
};

export default FilterForm;
