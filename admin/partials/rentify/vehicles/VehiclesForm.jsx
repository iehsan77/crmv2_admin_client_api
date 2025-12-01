"use client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormProvider as Form } from "react-hook-form";
import TextInput from "@/components/FormFields/TextInput";
import NumberInput from "@/components/FormFields/NumberInput";
import ColorSelect from "@/components/FormFields/ColorSelect";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";
import TextEditor from "@/components/FormFields/TextEditor/TextEditor";
import MultiSelectInput from "@/components/FormFields/MultiSelectInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import BrandsForm from "@/partials/rentify/brands/BrandsForm";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import {
  VEHICLES_CONDITIONS,
  VEHICLES_COLORS,
  VEHICLES_FUEL_TYPES,
  VEHICLES_SEATS,
  VEHICLES_TRANSMISSIONS,
  VEHICLES_STATUS,
} from "@/constants/rentify_constants";

import {
  ALLWOED_IMAGE_TYPES,
  ALLWOED_FILE_TYPES,
} from "@/constants/general_constants";

import useBrandsStore from "@/stores/rentify/useBrandsStore";
import useModelsStore from "@/stores/rentify/useModelsStore";
import useVariantsStore from "@/stores/rentify/useVariantsStore";
import useFeaturesStore from "@/stores/rentify/useFeaturesStore";
import useBodyTypesStore from "@/stores/rentify/useBodyTypesStore";
import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import useAffiliatesStore from "@/stores/rentify/affiliates/useAffiliatesStore";

import { useDrawer } from "@/context/drawer-context";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import YearPickerInput from "@/components/FormFields/YearPickerInput";

import toast from "react-hot-toast";

export default function VehiclesForm({ record }) {
  console.log(record);
  const [forAffiliate, setForAffiliate] = useState("0");
  const { showDrawer, hideDrawer } = useDrawer();

  const { brandsForDropdown, fetchBrandsForDropdown } = useBrandsStore();
  const { features, fetchFeatures } = useFeaturesStore();
  const { bodyTypes, fetchBodyTypes } = useBodyTypesStore();
  const { getModelsByBrandId, fetchModels } = useModelsStore();
  const { getVariantsByBrandAndModelId, fetchVariants } = useVariantsStore();
  const { affiliates, fetchAffiliates } = useAffiliatesStore();
  const { saveVehicle, updateVehicle } = useVehiclesStore();

  const [filteredModels, setFilteredModels] = useState([]);
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [affiliatesDataLoading, setAffiliatesDataLoading] = useState(true);
  const [affiliatesData, setAffiliatesData] = useState([]);

  const formSchema = z.object({
    id: z.number().default(0),
    title: z.string().min(1, { message: "English title is required" }),
    title_ar: z.string().optional(),
    brand_id: z.string().min(1, { message: "Brand is required" }),
    model_id: z.string().min(1, { message: "Model is required" }),
    variant_id: z.string().min(1, { message: "Variant is required" }),
    affiliate_id: z.string().optional(),
    vehicle_condition: z.string().optional(),
    year: z.number().min(1, { message: "Year is required" }),
    // purchase_date: z.coerce
    //   .date({ required_error: "Purchase date is required" })
    //   .max(new Date(), { message: "Purchase date cannot be in the future" }),
    purchase_date: z.any().optional(),
    purchase_price: z
      .string()
      .min(1, { message: "Purchase price is required" }),
    rent_price: z.string().min(1, { message: "Rental price is required" }),
    transmission_type_id: z
      .string()
      .min(1, { message: "Transmission is required" }),
    body_type_id: z.string().min(1, { message: "Body type is required" }),
    status_id: z.string().min(1, { message: "Status is required" }),
    top_speed: z.string().min(1, { message: "Top speed is required" }),
    acceleration: z.string().min(1, { message: "Acceleration is required" }),
    seats: z.string().min(1, { message: "Number of seats is required" }),
    fuel_tank_range: z
      .string()
      .min(1, { message: "Fuel tank range is required" }),
    fuel_type_id: z.string().min(1, { message: "Fuel type is required" }),
    mileage: z.string().min(1, { message: "Mileage Limit is required" }),
    exterior_color_id: z
      .string()
      .min(1, { message: "Exterior color is required" }),
    interior_color_id: z
      .string()
      .min(1, { message: "Interior color is required" }),
    number_plate: z.string().min(1, { message: "required" }),
    fitness_renewal_date: z.any().optional(),
    horse_power: z.string().min(1, { message: "Horsepower is required" }),
    feature_ids: z.array(z.string()),
    is_feature: z.boolean().optional(),

    insurer_name: z.string().optional(),
    insurance_issue_date: z.any().optional(),
    insurance_expiry_date: z.any().optional(),
    premium_payment: z.string().optional(),

    images: record
      ? z.array(z.any())
      : z
          .array(z.any())
          .min(1, { message: "Please upload at least one image" }),
    old_images: z.array(z.any().optional()),

    thumbnails: record
      ? z.array(z.any())
      : z
          .array(z.any())
          .min(1, { message: "Please upload at least one thumbnail" }),
    old_thumbnails: z.array(z.any().optional()),
    /*
    registration_document: z.union([
      z.string().optional(),
      z.instanceof(File).optional(),
    ]),
*/

    registration_document: record
      ? z.array(z.any())
      : z
          .array(z.any())
          .min(1, { message: "Please upload at least one thumbnail" }),
    old_registration_document: z.array(z.any().optional()),

    description: z.string().optional(),
    description_ar: z.string().optional(),
  });

  const getSafeArray = (value, defaultValue = []) => {
    return Array.isArray(value) && value.length > 0 ? value : defaultValue;
  };

  const defaultValues = {
    id: record?.id || 0,
    title: record?.title || "",
    title_ar: record?.title_ar || "",
    brand_id: record?.brand_id?.toString() || "",
    model_id: record?.model_id?.toString() || "",
    variant_id: record?.variant_id?.toString() || "",
    affiliate_id: record?.affiliate_id?.toString() || "",
    vehicle_condition: record?.vehicle_condition?.toString() || "",
    year: record?.year || 0,
    purchase_date: record?.purchase_date || "",
    purchase_price: record?.purchase_price?.toString() || "",
    rent_price: record?.rent_price?.toString() || "",
    transmission_type_id: record?.transmission_type_id?.toString() || "",
    body_type_id: record?.body_type_id?.toString() || "",
    status_id: record?.status_id?.toString() || "",
    top_speed: record?.top_speed?.toString() || "",
    acceleration: record?.acceleration?.toString() || "",
    seats: record?.seats?.toString() || "",
    fuel_tank_range: record?.fuel_tank_range?.toString() || "",
    fuel_type_id: record?.fuel_type_id?.toString() || "",
    mileage: record?.mileage?.toString() || "",
    exterior_color_id: record?.exterior_color_id?.toString() || "",
    interior_color_id: record?.interior_color_id?.toString() || "",
    number_plate: record?.number_plate || "",
    fitness_renewal_date: record?.fitness_renewal_date?.toString() || "",
    horse_power: record?.horse_power?.toString() || "",
    feature_ids: record?.feature_ids?.length
      ? record?.feature_ids?.map((r) => r.toString())
      : [],
    is_feature: record?.is_feature === 1 ? true : false,

    insurer_name: record?.insurer_name?.toString() || "",
    insurance_issue_date: record?.insurance_issue_date?.toString() || "",
    insurance_expiry_date: record?.insurance_expiry_date?.toString() || "",
    premium_payment: record?.premium_payment?.toString() || "",

    images: [],
    old_images: getSafeArray(
      record?.old_images,
      getSafeArray(record?.images, [])
    ),

    thumbnails: [],
    old_thumbnails: getSafeArray(
      record?.old_thumbnails,
      getSafeArray(record?.thumbnails, [])
    ),

    registration_document: [],
    old_registration_document: getSafeArray(
      record?.old_registration_document,
      getSafeArray(record?.registration_document, [])
    ),

    // registration_document: "",
    // old_registration_document: record?.old_registration_document || "",

    description: record?.description || "",
    description_ar: record?.description_ar || "",
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
    getValues,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = methods;

  const insuranceIssueDate = watch("insurance_issue_date");

  const onSubmit = async (formData) => {
    try {
      const { images, thumbnails, ...restFormData } = formData || {}; // Exclude images
      const body = {
        ...restFormData,
        images_qty: images?.length || 0,
        thumbnails_qty: thumbnails?.length || 0,
        ...(images || []).reduce((acc, img, index) => {
          acc[`images_${index}`] = img;
          return acc;
        }, {}),
        ...(thumbnails || []).reduce((acc, img, index) => {
          acc[`thumbnails_${index}`] = img;
          return acc;
        }, {}),
      };

      const response = await POST(
        rentify_endpoints?.rentify?.vehicles?.save,
        body
      );
      hideDrawer();

console.log("response after saved 258")
console.log(response)

      if (response?.status === 200) {
        toast.success("Record Saved");
        if (formData && formData?.id) {
          updateVehicle(response?.data || formData);
        } else {
          saveVehicle(response?.data || formData);
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  useEffect(() => {
    fetchBrandsForDropdown();
    fetchModels();
    fetchVariants();
    fetchFeatures();
    fetchBodyTypes();
    fetchAffiliates();
  }, [
    fetchBrandsForDropdown,
    fetchModels,
    fetchVariants,
    fetchFeatures,
    fetchBodyTypes,
    fetchAffiliates,
  ]);

  useEffect(() => {
    if (affiliates?.length > 0) {
      setAffiliatesDataLoading(true);
      const affiliateOptions = affiliates.map((a) => ({
        label: String(
          a?.first_name + " " + a?.last_name + " ( " + a?.email + " )"
        ),
        value: String(a?.id),
      }));
      setAffiliatesDataLoading(false);
      setAffiliatesData(affiliateOptions);
    }
  }, [affiliates]);

  const brand_id = watch("brand_id");
  useEffect(() => {
    setFilteredModels([]);
    if (brand_id) {
      setFilteredModels(getModelsByBrandId(brand_id));
    }
  }, [brand_id, setValue]);

  const model_id = watch("model_id");
  useEffect(() => {
    setFilteredVariants([]);
    if (brand_id && model_id) {
      setFilteredVariants(getVariantsByBrandAndModelId(brand_id, model_id));
    }
  }, [model_id, setValue]);

  const getOldImageDeleteUrl = (id) =>
    rentify_endpoints?.rentify?.vehicles?.deleteOldImage(id);

  const getOldDocumentDeleteUrl = (id) =>
    rentify_endpoints?.rentify?.vehicles?.deleteOldDocument(id);


  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
        <TabManager
          availableTabs={null}
          initialTabs={
            record?.id
              ? record?.affiliate_id
                ? [{ key: "1", label: "Affiliate's Vehicle" }]
                : [{ key: "0", label: "Own Vehicles" }]
              : [
                  { key: "0", label: "Own Vehicles" },
                  { key: "1", label: "Affiliate's Vehicle" },
                ]
          }
          allowClose={false}
          showAddView={false}
          onTabChange={(key) => setForAffiliate(key)}
        />
        {forAffiliate !== "0" ? (
          <div>
            <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
              Affiliate Information
            </div>
            <SingleSelectInput
              label="Affiliated Member"
              options={affiliatesData}
              value={watch("affiliate_id")}
              {...register("affiliate_id")}
              onChange={(option) => handleChange("affiliate_id", option)}
              error={errors.affiliate_id?.message}
              helperText="Select if this vehicle is affiliated."
              loading={affiliatesDataLoading}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <div>
            <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
              Add Vehicle Photos
            </div>
            <MultiImageUpload
              name="images"
              accept={ALLWOED_IMAGE_TYPES}
              value={watch("images")}
              previewValues={watch("old_images")}
              onChange={(val) => handleChange("images", val)}
              setError={setError}
              setValue={setValue}
              error={errors?.images?.message}
              deleteOldImageUrl={getOldImageDeleteUrl}
            />
          </div>
          <div>
            <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
              Add Vehicle Thumbnails
            </div>
            <MultiImageUpload
              name="thumbnails"
              accept={ALLWOED_IMAGE_TYPES}
              value={watch("thumbnails")}
              previewValues={watch("old_thumbnails")}
              onChange={(val) => handleChange("thumbnails", val)}
              setError={setError}
              setValue={setValue}
              error={errors?.thumbnails?.message}
              deleteOldImageUrl={getOldImageDeleteUrl}
            />
          </div>
          <div>
            <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
              Upload Registration Document
            </div>
            <MultiImageUpload
              name="registration_document"
              accept={ALLWOED_FILE_TYPES}
              value={watch("registration_document")}
              onChange={(val) => handleChange("registration_document", val)}
              setError={setError}
              error={errors?.registration_document?.message}
              deleteOldImageUrl={getOldDocumentDeleteUrl}
              previewValues={watch("old_registration_document")}
            />
          </div>
        </div>

        <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
          General Information
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          <TextInput
            label="Vehicle Title (EN)"
            error={errors.title?.message}
            value={watch("title")}
            {...register("title")}
            // allowedSymbols="- "
          />
          <TextInput
            dir="rtl"
            label="Vehicle Title (AR)"
            error={errors.title_ar?.message}
            value={watch("title_ar")}
            {...register("title_ar")}
          />
          <SingleSelectInput
            label="Brand"
            options={brandsForDropdown}
            value={watch("brand_id")}
            {...register("brand_id")}
            onChange={(option) => {
              handleChange("brand_id", option);
              handleChange("model_id", "");
            }}
            clearError={() => clearErrors("brand_id")}
            onCreate={(title) =>
              showDrawer({
                title: "Add Brand",
                size: "xl",
                content: (
                  <div className="py-4">
                    <BrandsForm
                      initialData={{ title }}
                      onSuccess={(e) => {
                        setBrandsOptions([
                          ...brands,
                          {
                            label: e?.title,
                            value: `brand${brands?.length + 1}`,
                          },
                        ]);
                        setValue("brand_id", `brand${brands?.length + 1}`);
                      }}
                    />
                  </div>
                ),
              })
            }
            error={errors.brand_id?.message}
          />
          <SingleSelectInput
            label="Model"
            options={getDropdownFormattedData(filteredModels)}
            value={watch("model_id")}
            {...register("model_id")}
            onChange={(option) => handleChange("model_id", option)}
            error={errors.model_id?.message}
            clearError={() => clearErrors("model_id")}
          />
          <SingleSelectInput
            label="Variant"
            options={getDropdownFormattedData(filteredVariants)}
            value={watch("variant_id")}
            {...register("variant_id")}
            onChange={(option) => handleChange("variant_id", option)}
            error={errors.variant_id?.message}
            clearError={() => clearErrors("variant_id")}
          />
          <SingleSelectInput
            label="Vehicle Condition"
            options={VEHICLES_CONDITIONS}
            value={watch("vehicle_condition")}
            {...register("vehicle_condition")}
            onChange={(option) => handleChange("vehicle_condition", option)}
            error={errors.vehicle_condition?.message}
            clearError={() => clearErrors("vehicle_condition")}
          />
          <YearPickerInput
            label="Year"
            value={watch("year")}
            {...register("year")}
            onChange={(option) => handleChange("year", option)}
            error={errors.year?.message}
            clearError={() => clearErrors("year")}
          />
          <DatePickerInput
            label="Car Purcahase Date"
            value={watch("purchase_date")}
            {...register("purchase_date")}
            onChange={(option) => handleChange("purchase_date", option)}
            error={errors.purchase_date?.message}
            clearError={() => clearErrors("purchase_date")}
            maxDate={new Date()}
          />
          <NumberInput
            label="Car Purchase Price"
            error={errors.purchase_price?.message}
            {...register("purchase_price")}
            value={watch("purchase_price")}
          />
          <NumberInput
            label="Car Rent Price"
            error={errors.rent_price?.message}
            {...register("rent_price")}
            value={watch("rent_price")}
          />
          {/* Transmission */}
          <SingleSelectInput
            label="Transmission"
            options={VEHICLES_TRANSMISSIONS}
            value={watch("transmission_type_id")}
            {...register("transmission_type_id")}
            onChange={(option) => handleChange("transmission_type_id", option)}
            error={errors.transmission_type_id?.message}
            clearError={() => clearErrors("transmission_type_id")}
          />
          {/* Body Type */}
          <SingleSelectInput
            label="Body Type"
            options={getDropdownFormattedData(bodyTypes)}
            value={watch("body_type_id")}
            {...register("body_type_id")}
            onChange={(option) => handleChange("body_type_id", option)}
            error={errors.body_type_id?.message}
            clearError={() => clearErrors("body_type_id")}
          />
          {/* Status */}
          <SingleSelectInput
            label="Status"
            options={VEHICLES_STATUS}
            value={watch("status_id")}
            {...register("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />
          <NumberInput
            label="Top Speed"
            error={errors.top_speed?.message}
            {...register("top_speed")}
            value={watch("top_speed")}
          />
          <NumberInput
            label="Acceleration"
            error={errors.acceleration?.message}
            {...register("acceleration")}
            value={watch("acceleration")}
            maxDigits={5}
            allowDecimal={true}
          />
          <SingleSelectInput
            label="Number of Seats"
            options={VEHICLES_SEATS}
            value={watch("seats")}
            {...register("seats")}
            onChange={(option) => handleChange("seats", option)}
            error={errors.seats?.message}
            clearError={() => clearErrors("seats")}
          />

          <NumberInput
            label="Fuel Tank Range"
            error={errors.fuel_tank_range?.message}
            {...register("fuel_tank_range")}
            value={watch("fuel_tank_range")}
          />
          {/* Fuel Type */}
          <SingleSelectInput
            label="Fuel Type"
            options={VEHICLES_FUEL_TYPES}
            value={watch("fuel_type_id")}
            {...register("fuel_type_id")}
            onChange={(option) => handleChange("fuel_type_id", option)}
            error={errors.fuel_type_id?.message}
            clearError={() => clearErrors("fuel_type_id")}
          />
          <NumberInput
            label="Mileage"
            error={errors.mileage?.message}
            {...register("mileage")}
            value={watch("mileage")}
          />
          {/* Exterior Color */}
          <ColorSelect
            label="Exterior Color"
            options={VEHICLES_COLORS}
            value={watch("exterior_color_id")}
            {...register("exterior_color_id")}
            onChange={(option) => handleChange("exterior_color_id", option)}
            error={errors.exterior_color_id?.message}
            clearError={() => clearErrors("exterior_color_id")}
          />
          {/* Interior Color */}
          <ColorSelect
            label="Interior Color"
            options={VEHICLES_COLORS}
            value={watch("interior_color_id")}
            {...register("interior_color_id")}
            onChange={(option) => handleChange("interior_color_id", option)}
            error={errors.interior_color_id?.message}
            clearError={() => clearErrors("interior_color_id")}
          />
          <TextInput
            label="Car Number Plate"
            value={watch("number_plate")}
            error={errors.number_plate?.message}
            {...register("number_plate")}
          />
          <DatePickerInput
            label="Fitness Renewal Date"
            value={watch("fitness_renewal_date")}
            {...register("fitness_renewal_date")}
            onChange={(option) => handleChange("fitness_renewal_date", option)}
            error={errors.fitness_renewal_date?.message}
            clearError={() => clearErrors("fitness_renewal_date")}
            minDate={new Date()}
          />
          <TextInput
            label="Horse Power"
            value={watch("horse_power")}
            error={errors.horse_power?.message}
            {...register("horse_power")}
          />
          <MultiSelectInput
            label="Features"
            options={getDropdownFormattedData(features)}
            value={watch("feature_ids")}
            {...register("feature_ids")}
            onChange={(option) => handleChange("feature_ids", option)}
            error={errors.feature_ids?.message}
            clearError={() => clearErrors("feature_ids")}
          />
          <CheckboxInput
            title={`Feature on Homepage`}
            checked={watch("is_feature")}
            {...register("is_feature")}
            error={errors?.is_feature?.message}
          />
        </div>

        <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
          Insurance Information
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          <TextInput
            label="Insurer Name"
            value={watch("insurer_name")}
            error={errors.insurer_name?.message}
            {...register("insurer_name")}
          />
          <DatePickerInput
            label="Insurance issue date"
            value={watch("insurance_issue_date")}
            {...register("insurance_issue_date")}
            onChange={(option) => handleChange("insurance_issue_date", option)}
            error={errors.insurance_issue_date?.message}
            clearError={() => clearErrors("insurance_issue_date")}
            maxDate={new Date()}
          />
          <DatePickerInput
            label="Insurance expiry date"
            value={watch("insurance_expiry_date")}
            {...register("insurance_expiry_date")}
            onChange={(option) => handleChange("insurance_expiry_date", option)}
            error={errors.insurance_expiry_date?.message}
            clearError={() => clearErrors("insurance_expiry_date")}
            minDate={insuranceIssueDate}
          />
          <NumberInput
            label="Premium Payment"
            error={errors.premium_payment?.message}
            {...register("premium_payment")}
            value={watch("premium_payment")}
          />
        </div>

        <TextEditor
          label="Description (EN)"
          name="description"
          value={watch("description")}
          onChange={(val) => handleChange("description", val)}
        />
        <TextEditor
          label="Description (AR)"
          name="description_ar"
          value={watch("description_ar")}
          onChange={(val) => handleChange("description_ar", val)}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            type="button"
            className="bg-transparent"
          >
            Cancel
          </Button>
          <Button size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
