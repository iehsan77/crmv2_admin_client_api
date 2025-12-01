"use client";
import { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";

import toast from "react-hot-toast";
import Image from "next/image";

import { FormProvider as Form } from "react-hook-form";
import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import RadioSelectionButton from "@/components/FormFields/RadioSelectionButton";

import { slugify } from "@/helper/EcomActions";

import { useDrawer } from "@/context/drawer-context";

import useVariantsStore from "@/stores/rentify/useVariantsStore";
import useBrandsStore from "@/stores/rentify/useBrandsStore";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useModelsStore from "@/stores/rentify/useModelsStore";

//export default function VariantsForm({initialData, currentData, onSuccess}) {
export default function VariantsForm({ record }) {
  const { hideDrawer } = useDrawer();
  const { saveVariant, updateVariant } = useVariantsStore();
  const { brandsForDropdown, fetchBrandsForDropdown } = useBrandsStore();
  const { models, fetchModels } = useModelsStore();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [filteredModels, setFilteredModels] = useState(null);

//console.log("brandsForDropdown 40");  console.log(brandsForDropdown);


  useEffect(() => {
    fetchBrandsForDropdown();
    fetchModels();
  }, [fetchBrandsForDropdown, fetchModels]);

  useEffect(() => {
    //alert(selectedBrand)
    if (!selectedBrand) {
      setFilteredModels([]); // or set full list if needed
      return;
    }

    const filtered = models
      .filter((model) => Number(model.brand_id) === Number(selectedBrand))
      .map(({ id, title }) => ({
        value: String(id),
        label: String(title),
      }));

    console.log(filtered);

    setFilteredModels(filtered);
  }, [selectedBrand, models]);

  /*
   const filteredModels = useMemo(() => {
      if (!selectedBrand) return modelsForDropdown;
      return modelsForDropdown.filter(
        (model) => model.brand_id === Number(selectedBrand)
      );
    }, [modelsForDropdown, selectedBrand]);
    */

  const formSchema = z.object({
    id: z.number().default(0),
    title: z.string().min(1, { message: "required" }),
    title_ar: z.string().optional(),
    slug: z.string().optional(),
    brand_id: z.number().min(1, "required"),
    model_id: z.number().min(1, "required"),
    active: z.number().optional(),
  });

  const defaultValues = {
    id: record?.id || Date.now(), // agar naya hai to unique id
    title: record?.title || "",
    title_ar: record?.title_ar || "",
    brand_id: record?.brand_id || 0,
    model_id: record?.model_id || 0,
    active: record?.active > 0 ? 1 : 0,
  };

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        id: record?.id || 0,
        slug: slugify(formData?.title),
        origin_country: "",
      };

      const response = await POST(
        rentify_endpoints?.rentify?.variants?.save,
        body
      );

      if (response?.status === 200) {
        toast.success("Record Saved");
        reset();
        hideDrawer();

        if (record && record?.id) {
          updateVariant(response?.data || formData);
        } else {
          saveVariant(response?.data || formData);
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {

    //console.log("name "+name); console.log("value "+value);

    setValue(name, value);
    setSelectedBrand(value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-8 pt-4">
          <TextInput
            label="Variant Name (EN)"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />
          <TextInput
            dir="rtl"
            label="Variant Name (AR)"
            value={watch("title_ar")}
            maxLength={100}
            error={errors.title_ar?.message}
            {...register("title_ar")}
          />
          <SingleSelectInput
            label="Brand"
            options={brandsForDropdown}
            value={watch("brand_id")}
            onChange={(option) => handleChange("brand_id", option)}
            error={errors.brand_id?.message}
            clearError={() => clearErrors("brand_id")}
          />
          <SingleSelectInput
            label="Model"
            options={filteredModels}
            value={watch("model_id")}
            onChange={(option) => handleChange("model_id", option)}
            error={errors.model_id?.message}
            clearError={() => clearErrors("model_id")}
          />

          <RadioSelectionButton
            options={[
              { label: "Active", value: 1 },
              { label: "In-Active", value: 0 },
            ]}
            value={watch("active")}
            onChange={(option) => handleChange("active", option)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="lg"
              type="button"
              className="bg-transparent"
              onClick={() => hideDrawer()}
            >
              Cancel
            </Button>
            <Button size="lg" type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
