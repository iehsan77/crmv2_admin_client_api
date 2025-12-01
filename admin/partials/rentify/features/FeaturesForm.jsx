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

import useFeaturesStore from "@/stores/rentify/useFeaturesStore";
import useBrandsStore from "@/stores/rentify/useBrandsStore";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useModelsStore from "@/stores/rentify/useModelsStore";

//export default function FeaturesForm({initialData, currentData, onSuccess}) {
export default function FeaturesForm({ record }) {
  const { hideDrawer } = useDrawer();
  const { saveFeature, updateFeature } = useFeaturesStore();

  const formSchema = z.object({
    id: z.number().default(0),
    title: z.string().min(1, { message: "required" }),
    title_ar: z.string().optional(),
    slug: z.string().optional(),
    active: z.number().optional(),
  });

  const defaultValues = {
    id: record?.id || Date.now(), // agar naya hai to unique id
    title: record?.title || "",
    title_ar: record?.title_ar || "",
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
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        id: record?.id || 0,
        slug: slugify(formData?.title),
      };
      
      const response = await POST(
        rentify_endpoints?.rentify?.features?.save,
        body
      );
      
      if (response?.status === 200) {
        toast.success("Record Saved");
        reset();
        hideDrawer();

        if (record && record?.id) {
          updateFeature(response?.data || formData);
        } else {
          saveFeature(response?.data || formData);
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
        <div className="space-y-8 pt-4">
          <TextInput
            label="Feature Name (EN)"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />
          <TextInput
            dir="rtl"
            label="Feature Name (AR)"
            value={watch("title_ar")}
            maxLength={100}
            error={errors.title_ar?.message}
            {...register("title_ar")}
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
