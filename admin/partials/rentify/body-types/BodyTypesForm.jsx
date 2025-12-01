"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";

import Image from "next/image";

import { FormProvider as Form } from "react-hook-form";
import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import RadioSelectionButton from "@/components/FormFields/RadioSelectionButton";

import { slugify } from "@/helper/EcomActions";

import { useDrawer } from "@/context/drawer-context";

import useBodyTypesStore from "@/stores/rentify/useBodyTypesStore";
import useCommonStore from "@/stores/useCommonStore";

import toast from "react-hot-toast";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import NumberInput from "@/components/FormFields/NumberInput";

import {ALLWOED_IMAGE_TYPES} from "@/constants/general_constants";

//export default function BodyTypesForm({initialData, currentData, onSuccess}) {
export default function BodyTypesForm({ record }) {
  const { hideDrawer } = useDrawer();
  const { saveBodyType, updateBodyType } = useBodyTypesStore();

  const formSchema = z
    .object({
      id: z.number().default(0),
      title: z.string().min(1, { message: "required" }),
      title_ar: z.string().optional(),
      slug: z.string().optional(),
      security_deposit: z.string().min(1, "required"),
      logo: z.union([z.string(), z.instanceof(File)]).optional(),
      old_logo: z.string().optional(),
      active: z.number(),
    })
    .superRefine((data, ctx) => {
      const isOldEmpty = !data.old_logo?.trim();
      const isLogoEmpty =
        !(data.logo instanceof File) &&
        (typeof data.logo !== "string" || !data.logo?.trim());

      if (isOldEmpty && isLogoEmpty) {
        ctx.addIssue({
          code: "custom",
          path: ["logo"],
          message: "required",
        });
      }
    });

  const defaultValues = {
    id: record?.id || Date.now(),
    title: record?.title || "",
    title_ar: record?.title_ar || "",
    slug: record?.slug || "",
    security_deposit: record?.security_deposit.toString() || "",
    logo: "",
    old_logo: record?.logo || "",
    active: record?.active ?? 1,
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
        rentify_endpoints?.rentify?.bodyTypes?.save,
        body
      );

      
      if (response?.status === 200) {
        toast.success("Record Saved");
        reset();
        hideDrawer();

        if (record && record?.id) {
          updateBodyType(response?.data || formData);
        } else {
          saveBodyType(response?.data || formData);
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
              onRemove={(val) => handleChange("old_logo", val)}
              setError={setError}
              error={errors?.logo?.message}
            />
          </div>
          <TextInput
            label="BodyType Name (EN)"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />
          <TextInput
            dir="rtl"
            label="BodyType Name (AR)"
            value={watch("title_ar")}
            maxLength={100}
            error={errors.title_ar?.message}
            {...register("title_ar")}
          />

          <NumberInput
            label="Security Deposit Amount"
            
            maxLength={100}
            error={errors.security_deposit?.message}
            {...register("security_deposit")}
            value={watch("security_deposit")}
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
