"use client";
import { useEffect, useState } from "react";
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

import useModelsStore from "@/stores/rentify/useModelsStore";
import useBrandsStore from "@/stores/rentify/useBrandsStore";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import {ALLWOED_IMAGE_TYPES} from "@/constants/general_constants";

//export default function ModelsForm({initialData, currentData, onSuccess}) {
export default function ModelsForm({ record }) {
  const { hideDrawer } = useDrawer();
  const { saveModel, updateModel } = useModelsStore();
  const { brandsForDropdown, fetchBrandsForDropdown } = useBrandsStore();

  useEffect(() => {
    fetchBrandsForDropdown();
  }, [fetchBrandsForDropdown]);

  const formSchema = z
    .object({
      id: z.number().default(0),
      title: z.string().min(1, { message: "required" }),
      title_ar: z.string().optional(),
      slug: z.string().optional(),
      brand_id: z.number().min(1, "required"),
      logo: z.union([z.string(), z.instanceof(File)]).optional(),
      old_logo: z.string(),
      active: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      const { old_logo, logo } = data;
      const isOldEmpty = !old_logo?.trim();
      const isLogoEmpty =
        !(logo instanceof File) && (typeof logo !== "string" || !logo?.trim());

      if (isOldEmpty && isLogoEmpty) {
        ctx.addIssue({
          code: "custom",
          path: ["logo"],
          message: "required",
        });
      }
    });

  const defaultValues = {
    id: record?.id || 0,
    title: record?.title || "",
    title_ar: record?.title_ar || "",
    brand_id: record?.brand_id || 0,
    logo: "",
    old_logo: record?.logo || "",
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

      const response = await POST(rentify_endpoints?.rentify?.models?.save, body);
      
      if (response?.status === 200) {
        toast.success("Record Saved");
        reset();
        hideDrawer();

        if (record && record?.id) {
          updateModel(response?.data || formData);
        } else {
          saveModel(response?.data || formData);
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-8">
          <div className="col-span-3">
            <div className="text-base mb-4 font-medium">Upload Logo</div>
            <SingleUpload2
              name="logo"
              accept={ALLWOED_IMAGE_TYPES}
              value={record?.logo ? watch("old_logo") : watch("logo")}
              onChange={(val) => handleChange("logo", val)}
              setError={setError}
              error={errors?.logo?.message}
              onRemove={() => setValue("old_logo", '')}
            />
          </div>
          <TextInput
            label="Model Name (EN)"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />
          <TextInput
            dir="rtl"
            label="Model Name (AR)"
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
