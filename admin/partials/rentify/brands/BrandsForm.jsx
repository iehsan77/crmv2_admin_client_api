"use client";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Image from "next/image";

import { FormProvider as Form } from "react-hook-form";
import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import RadioSelectionButton from "@/components/FormFields/RadioSelectionButton";

import { slugify } from "@/helper/EcomActions";

import { useDrawer } from "@/context/drawer-context";

import useBrandsStore from "@/stores/rentify/useBrandsStore";
import useCommonStore from "@/stores/useCommonStore";

import toast from "react-hot-toast";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { ALLWOED_IMAGE_TYPES } from "@/constants/general_constants";

//export default function BrandsForm({initialData, currentData, onSuccess}) {
export default function BrandsForm({ record }) {
  const { hideDrawer } = useDrawer();
  const { saveFilteredBrand, updateFilteredBrand } = useBrandsStore();
  const { countries, fetchCountries } = useCommonStore();

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const formSchema = z
    .object({
      id: z.number().default(0),
      title: z.string().min(1, { message: "required" }),
      title_ar: z.string().optional(),
      slug: z.string().optional(),
      origin_country_id: z.number().min(1, "required"),
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
    origin_country_id: record?.origin_country_id || 0,
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

      const response = await POST(
        rentify_endpoints?.rentify?.brands?.save,
        body
      );

      if (response?.status === 200) {
        hideDrawer();
        toast.success("Record Saved");
        reset();

        if (formData?.id) {
          updateFilteredBrand(response?.data);
        } else {
          saveFilteredBrand(response?.data);
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
              error={errors?.logo?.message || errors?.old_logo?.message}
            />
          </div>
          <TextInput
            label="Brand Name (EN)"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />
          <TextInput
            dir="rtl"
            label="Brand Name (AR)"
            value={watch("title_ar")}
            maxLength={100}
            error={errors.title_ar?.message}
            {...register("title_ar")}
          />
          <SingleSelectInput
            label="Country of origin"
            options={countries?.map((country) => ({
              value: country?.id,
              label: country?.title,
              icon: (
                <Image src={country?.flag} alt="flag" width={20} height={20} />
              ),
            }))}
            value={watch("origin_country_id")}
            onChange={(option) => handleChange("origin_country_id", option)}
            error={errors.origin_country_id?.message}
            clearError={() => clearErrors("origin_country_id")}
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
            <Button size="lg" type="submit" isSubmitting={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
