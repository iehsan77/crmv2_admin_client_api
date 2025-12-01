"use client";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import NumberInput from "@/components/FormFields/NumberInput";
import useVehiclesStore from "@/stores/rentify/useVehiclesStore";
import { useEffect } from "react";
import {
  VEHICLES_COLORS,
  VEHICLES_FUEL_TYPES,
} from "@/constants/rentify_constants";
import {
  ACTIVE_OPTIONS,
} from "@/constants/general_constants";

export const getDropdownFormattedData = (data) =>
  Array.isArray(data)
    ? data.map((opt) => ({
        ...opt,
        value: String(opt?.id),
        label: String(opt?.title),
      }))
    : [];

export const VEHICLES_INTERIOR_CONDITIONS = [
  { label: "Excellent", value: "1" },
  { label: "Very Good", value: "2" },
  { label: "Good", value: "3" },
  { label: "Fair", value: "4" },
  { label: "Poor", value: "5" },
];
export const VEHICLES_EXTERIOR_CONDITIONS = [
  { label: "Scratchless", value: "1" },
  { label: "Minor Scratches", value: "2" },
  { label: "Few Dents", value: "3" },
  { label: "Repainted Panels", value: "4" },
  { label: "Accidental/Needs Repair", value: "5" },
];
export const VEHICLES_TYRE_CONDITIONS = [
  { label: "Brand New", value: "1" },
  { label: "Excellent", value: "2" },
  { label: "Good", value: "3" },
  { label: "Worn", value: "4" },
  { label: "Needs Replacement", value: "5" },
];
export const VEHICLES_FUEL_LEVELS = [
  { label: "Empty", value: "1" },
  { label: "Quarter Tank", value: "2" },
  { label: "Half Tank", value: "3" },
  { label: "Three Quarters Tank", value: "4" },
  { label: "Full Tank", value: "5" },
];

const VehicleSelectionForm = ({
  watch,
  errors,
  handleChange,
  register,
  clearErrors,
  getValues,
  setValue,
  record,
  affiliateId,
}) => {
  const { vehicles, vehiclesLoading, fetchVehicles } = useVehiclesStore();

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filteredVehicles = affiliateId
    ? vehicles?.filter((v) => v?.affiliate_id === Number(affiliateId))
    : vehicles;

  const onVehicleSelect = (option) => {
    // fill all the fields from option
    setValue("vehicle_registration_no", option?.vehicle_uid || "");
    setValue("number_plate", option?.number_plate || "");
    setValue("exterior_color_id", option?.exterior_color_id?.toString() || "");
    setValue("interior_color_id", option?.interior_color_id?.toString() || "");
    setValue("fuel_type_id", String(option?.fuel_type_id) || "");
    setValue("rent_price", String(option?.rent_price) || "");
    setValue(
      "security_deposit",
      String(option?.body_type_details?.security_deposit) || ""
    );

    clearErrors([
      "vehicle_registration_no",
      "number_plate",
      "exterior_color_id",
      "interior_color_id",
      "fuel_type_id",
    ]);
  };
  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Vehicle Selection
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-8">
        <SingleSelectInput
          label="Select Vehicle"
          options={getDropdownFormattedData(filteredVehicles)}
          value={watch("vehicle_id")}
          onChange={(option) => handleChange("vehicle_id", option)}
          onSelect={onVehicleSelect}
          error={errors.vehicle_id?.message}
          clearError={() => clearErrors("vehicle_id")}
          loading={vehiclesLoading}
        />
        <TextInput
          label="Vehicle Registration Number"
          value={watch("vehicle_registration_no")}
          {...register("vehicle_registration_no")}
          error={errors.vehicle_registration_no?.message}
          disabled
        />
        <TextInput
          label="Vehicle Number Plate"
          value={watch("number_plate")}
          {...register("number_plate")}
          error={errors.number_plate?.message}
          disabled
        />
        <SingleSelectInput
          label="Exterior Color"
          options={VEHICLES_COLORS}
          value={watch("exterior_color_id")}
          onChange={(option) => handleChange("exterior_color_id", option)}
          error={errors.exterior_color_id?.message}
          clearError={() => clearErrors("exterior_color_id")}
          disabled
        />
        <SingleSelectInput
          label="Interior Color"
          options={VEHICLES_COLORS}
          value={watch("interior_color_id")}
          onChange={(option) => handleChange("interior_color_id", option)}
          error={errors.interior_color_id?.message}
          clearError={() => clearErrors("interior_color_id")}
          disabled
        />
        <SingleSelectInput
          label="Fuel Type"
          options={VEHICLES_FUEL_TYPES}
          value={watch("fuel_type_id")}
          onChange={(option) => handleChange("fuel_type_id", option)}
          error={errors.fuel_type_id?.message}
          clearError={() => clearErrors("fuel_type_id")}
          disabled
        />
        <SingleSelectInput
          label="Fuel Level"
          options={VEHICLES_FUEL_LEVELS}
          value={watch("fuel_level_id")}
          onChange={(option) => handleChange("fuel_level_id", option)}
          error={errors.fuel_level_id?.message}
          clearError={() => clearErrors("fuel_level_id")}
        />
        <SingleSelectInput
          label="Exterior Condition"
          options={VEHICLES_EXTERIOR_CONDITIONS}
          value={watch("exterior_condition_id")}
          onChange={(option) => handleChange("exterior_condition_id", option)}
          error={errors.exterior_condition_id?.message}
          clearError={() => clearErrors("exterior_condition_id")}
        />
        <SingleSelectInput
          label="Interior Condition"
          options={VEHICLES_INTERIOR_CONDITIONS}
          value={watch("interior_condition_id")}
          onChange={(option) => handleChange("interior_condition_id", option)}
          error={errors.interior_condition_id?.message}
          clearError={() => clearErrors("interior_condition_id")}
        />
        <SingleSelectInput
          label="Tyre Condition"
          options={VEHICLES_TYRE_CONDITIONS}
          value={watch("tyre_condition_id")}
          onChange={(option) => handleChange("tyre_condition_id", option)}
          error={errors.tyre_condition_id?.message}
          clearError={() => clearErrors("tyre_condition_id")}
        />
        <SingleSelectInput
          label="Spare Tyre"
          options={ACTIVE_OPTIONS}
          value={watch("spare_tyre")}
          onChange={(option) => handleChange("spare_tyre", option)}
          error={errors.spare_tyre?.message}
          clearError={() => clearErrors("spare_tyre")}
        />
        <SingleSelectInput
          label="Toolkit"
          options={ACTIVE_OPTIONS}
          value={watch("toolkit")}
          onChange={(option) => handleChange("toolkit", option)}
          error={errors.toolkit?.message}
          clearError={() => clearErrors("toolkit")}
        />
        <NumberInput
          label="Mileage At Pickup"
          {...register("mileage_at_pickup")}
          value={watch("mileage_at_pickup")}
          error={errors.mileage_at_pickup?.message}
        />
        <NumberInput
          label="Mileage Limit"
          {...register("mileage_limit")}
          value={watch("mileage_limit")}
          error={errors.mileage_limit?.message}
        />
      </div>
    </>
  );
};

export default VehicleSelectionForm;
