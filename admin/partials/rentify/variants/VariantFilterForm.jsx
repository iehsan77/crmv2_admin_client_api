"use client";
import React, { useState, useEffect, useMemo } from "react";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Search, Eraser } from "lucide-react";
import toast from "react-hot-toast";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";

import useCommonStore from "@/stores/useCommonStore";
import useVariantsStore, {
  useVariantsFiltersStore,
} from "@/stores/rentify/useVariantsStore";
import useBrandsStore from "@/stores/rentify/useBrandsStore";
import { useDrawer } from "@/context/drawer-context";

import { LAST_ACTIVITY } from "@/constants/rentify_constants";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const VariantFilterForm = ({ isDrawer = false }) => {
  const { hideDrawer } = useDrawer();
  const { fetchVariants } = useVariantsStore();
  const { brands, fetchBrands } = useBrandsStore();
  const { countries, fetchCountries } = useCommonStore();

  const [allVariants, setAllVariants] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const { updateFilterValue, filterValues } = useVariantsFiltersStore();

  // 🔹 Fetch variants + countries + brands
  useEffect(() => {
    fetchCountries();
    fetchBrands();

    const fetchVariant = async () => {
      try {
        setLoading(true);
        const response = await POST(rentify_endpoints?.rentify?.variants?.get);
        if (response?.status === 200) {
          setAllVariants(response.data);
        } else {
          toast.error(response?.message || "Failed to fetch variants");
        }
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        toast.error("Something went wrong while fetching variants");
      } finally {
        setLoading(false);
      }
    };

    const fetchModel = async () => {
      try {
        setLoading(true);
        const response = await POST(rentify_endpoints?.rentify?.models?.get);
        if (response?.status === 200) {
          setAllModels(response.data);
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

    fetchVariant();
    fetchModel();
  }, [fetchCountries, fetchBrands]);

  // 🔹 Filter models by selected brand
  const filteredModels = useMemo(() => {
    if (!filterValues?.brand_id) return allModels;
    return allModels.filter(
      (model) => model.brand_id === Number(filterValues.brand_id.value)
    );
  }, [allModels, filterValues?.brand_id]);

  // 🔹 Filter variants by selected model
  const filteredVariants = useMemo(() => {
    if (!filterValues?.model_id) return allVariants;
    return allVariants.filter(
      (variant) => variant.model_id === Number(filterValues.model_id.value)
    );
  }, [allVariants, filterValues?.model_id]);

  // 🔹 Submit handler
  const onSubmit = () => {

    const formData = filterValues;

    //console.log("formData 98");  console.log(formData); return false;

    const body = {
      brand_id: formData?.brand_id ? Number(formData.brand_id.value) : null,
      model_id: formData?.model_id ? Number(formData.model_id.value) : null,
      variant_id: formData?.variant_id
        ? Number(formData.variant_id.value)
        : null,
      origin_country_id: formData?.origin_country_id
        ? Number(formData.origin_country_id.value)
        : null,
      last_activity: formData?.last_activity?.value || null,
    };

    fetchVariants(body);
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
        onChange={(val) => {
          updateFilterValue("brand_id", val);
          updateFilterValue("model_id", null); // reset model
          updateFilterValue("variant_id", null); // reset variant
        }}
        isLoading={loading}
      />

      <DropdownFilter
        label="Model"
        options={getDropdownFormattedData(filteredModels)}
        value={filterValues.model_id}
        onChange={(val) => {
          updateFilterValue("model_id", val);
          updateFilterValue("variant_id", null); // reset variant
        }}
        isLoading={loading}
      />

      <DropdownFilter
        label="Variant"
        options={getDropdownFormattedData(filteredVariants)}
        value={filterValues.variant_id}
        onChange={(val) => updateFilterValue("variant_id", val)}
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

export default VariantFilterForm;
