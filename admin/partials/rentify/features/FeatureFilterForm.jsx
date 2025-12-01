"use client";
import React, { useState, useEffect } from "react";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Search, Eraser } from "lucide-react";
import toast from "react-hot-toast";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";

import useCommonStore from "@/stores/useCommonStore";
import useFeaturesStore, {
  useFeaturesFiltersStore,
} from "@/stores/rentify/useFeaturesStore";
import useBrandsStore from "@/stores/rentify/useBrandsStore";
import { useDrawer } from "@/context/drawer-context";

import { LAST_ACTIVITY } from "@/constants/rentify_constants";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const FeatureFilterForm = ({ isDrawer = false }) => {
  const { hideDrawer } = useDrawer();
  const { fetchFeatures } = useFeaturesStore();
  const { brands, fetchBrands } = useBrandsStore();
  const { countries, fetchCountries } = useCommonStore();

  const [allFeatures, setAllFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const { updateFilterValue, filterValues } = useFeaturesFiltersStore();

  // 🔹 Fetch models + countries + brands
  useEffect(() => {
    fetchCountries();
    fetchBrands();
    const init = async () => {
      setLoading(true);
      try {
        const response = await POST(rentify_endpoints?.rentify?.models?.get);
        if (response?.status === 200) {
          setAllFeatures(response.data);
        } else {
          toast.error(response?.message || "Failed to fetch models");
        }
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        toast.error("Something went wrong while fetching models");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchCountries, fetchBrands]);

  // 🔹 Submit handler
  const onSubmit = () => {
    const formData = filterValues;
    const body = {
      brand_id: formData?.brand_id ? Number(formData.brand_id.value) : null,
      model_id: formData?.model_id ? Number(formData.model_id.value) : null,
      origin_country_id: formData?.origin_country_id
        ? Number(formData.origin_country_id.value)
        : null,
      last_activity: formData?.last_activity?.value || null,
    };

    fetchFeatures(body);
    hideDrawer?.();
  };

  const reloadPage = () => window.location.reload();

  return (
    <div
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
        isLoading={loading}
      />

      <DropdownFilter
        label="Feature"
        options={getDropdownFormattedData(allFeatures)}
        value={filterValues.model_id}
        onChange={(val) => updateFilterValue("model_id", val)}
        isLoading={loading}
      />

      <DropdownFilter
        label="Country of Origin"
        options={getDropdownFormattedData(countries)}
        value={filterValues.origin_country_id}
        onChange={(val) => updateFilterValue("origin_country_id", val)}
      />

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

export default FeatureFilterForm;
