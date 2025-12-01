"use client";
import { useRef, useState, useEffect } from "react";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import NumberInput from "@/components/FormFields/NumberInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";

import useCustomersStore from "@/stores/customers/useCustomersStore";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";

import { ALLWOED_FILE_TYPES, NATIONALITY } from "@/constants/general_constants";

const IndividualBookingForm = ({
  watch,
  errors,
  handleChange,
  setError,
  register,
  clearErrors,
  getValues,
  setValue,
  record,
}) => {
  const isDisabled = getValues("customer_id");

  const { customers, fetchCustomers } = useCustomersStore();

  const onCustomerSelect = (option) => {
    // fill all the fields from option
    setValue("first_name", option?.first_name || "");
    setValue("last_name", option?.last_name || "");
    setValue("contact", option?.contact || "");
    setValue("email", option?.email || "");
    setValue("driving_license_no", option?.driving_license_no || "");
    setValue("driving_license_expiry", option?.driving_license_expiry || "");
    setValue("passport_id", option?.passport_id || "");
    setValue("passport_expiry", option?.passport_expiry || "");
    setValue("visa_no", option?.visa_no || "");
    setValue("visa_expiry", option?.visa_expiry || "");
    setValue("nationality_id", option?.nationality_id?.toString() || "");
    setValue("address1", option?.address1 || "");
    setValue("address2", option?.address2 || "");
    setValue("postal_code", option?.postal_code || "");
    setValue("driving_license", []);
    setValue("old_driving_license", option?.driving_license || []);
    setValue("registration_document", []);
    setValue("old_registration_document", option?.registration_document || []);
    clearErrors([
      "first_name",
      "last_name",
      "contact",
      "email",
      "driving_license_no",
      "driving_license_expiry",
      "passport_id",
      "passport_expiry",
      "visa_no",
      "visa_expiry",
      "nationality_id",
      "address1",
      "address2",
      "postal_code",
      "driving_license",
      "old_driving_license",
      "registration_document",
    ]);
  };

  useEffect(() => {
    // const body = {
    //   is_company: 0,
    // };
    fetchCustomers();
  }, [fetchCustomers]);

  const customer_id = watch("customer_id");
  const contact = watch("contact");
  const email = watch("email");
  const driving_license_no = watch("driving_license_no");
  const passport_id = watch("passport_id");
  const visa_no = watch("visa_no");

  useEffect(() => {
    if (customer_id) return;
    if (!customers?.length) return;

    // map of fieldName -> value
    const fieldsToCheck = {
      contact,
      email,
      driving_license_no,
      passport_id,
      visa_no,
    };

    Object.entries(fieldsToCheck).forEach(([fieldName, fieldValue]) => {
      /*     
      if (!fieldValue) {
        clearErrors(fieldName);
        return;
      }
  */
      // check if this value already exists in any customer
      const isDuplicate = customers.some(
        (c) => String(c?.[fieldName]) === String(fieldValue)
      );

      if (isDuplicate) {
        setError(fieldName, {
          type: "manual",
          message: `${fieldName.replaceAll("_", " ")} already exists`,
        });
      } 
      //else { clearErrors(fieldName); }
    });
  }, [
    contact,
    email,
    driving_license_no,
    passport_id,
    visa_no,
    customers,
    setError,
    clearErrors,
  ]);

  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Client Information
      </div>

      <SingleSelectInput
        label="Select Customer"
        options={
          customers?.length ? customers?.filter((c) => c?.is_company === 0) : []
        }
        value={watch("customer_id")}
        onChange={(option) => handleChange("customer_id", option)}
        onSelect={onCustomerSelect}
        error={errors.customer_id?.message}
        clearError={() => clearErrors("customer_id")}
      />

      <div className="space-y-2">
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Upload Driving License
          </div>
          <MultiImageUpload
            name="driving_license"
            accept={ALLWOED_FILE_TYPES}
            value={watch("driving_license")}
            previewValues={watch("old_driving_license")}
            onChange={(val) => handleChange("driving_license", val)}
            setError={setError}
            // setValue={setValue}
            error={errors?.driving_license?.message}
            disabled={isDisabled}
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
            previewValues={watch("old_registration_document")}
            onChange={(val) => handleChange("registration_document", val)}
            setError={setError}
            error={errors?.registration_document?.message}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-8">
        <TextInput
          label="First Name"
          value={watch("first_name")}
          {...register("first_name")}
          error={errors.first_name?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Last Name"
          value={watch("last_name")}
          {...register("last_name")}
          error={errors.last_name?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Contact Number"
          value={watch("contact")}
          {...register("contact")}
          error={errors.contact?.message}
          allowLetters={false}
          allowedSymbols="-+()"
          disabled={isDisabled}
        />
        <TextInput
          label="Email Address"
          type="email"
          value={watch("email")}
          {...register("email")}
          error={errors.email?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Driving License Number"
          {...register("driving_license_no")}
          value={watch("driving_license_no")}
          error={errors.driving_license_no?.message}
          allowedSymbols="-"
          disabled={isDisabled}
        />
        <DatePickerInput
          label="Driving License Expiry Date"
          value={watch("driving_license_expiry")}
          onChange={(option) => handleChange("driving_license_expiry", option)}
          error={errors.driving_license_expiry?.message}
          clearError={() => clearErrors("driving_license_expiry")}
          disabled={isDisabled}
          minDate={new Date()}
        />
        <TextInput
          label="Passport ID"
          {...register("passport_id")}
          value={watch("passport_id")}
          error={errors.passport_id?.message}
          allowedSymbols="-"
          disabled={isDisabled}
        />
        <DatePickerInput
          label="Passport Expiry Date"
          value={watch("passport_expiry")}
          onChange={(option) => handleChange("passport_expiry", option)}
          error={errors.passport_expiry?.message}
          clearError={() => clearErrors("passport_expiry")}
          disabled={isDisabled}
          minDate={new Date()}
        />
        <TextInput
          label="Visa Number"
          {...register("visa_no")}
          value={watch("visa_no")}
          error={errors.visa_no?.message}
          allowedSymbols="-"
          disabled={isDisabled}
        />
        <DatePickerInput
          label="Visa Expiry Date"
          value={watch("visa_expiry")}
          onChange={(option) => handleChange("visa_expiry", option)}
          error={errors.visa_expiry?.message}
          clearError={() => clearErrors("visa_expiry")}
          disabled={isDisabled}
          minDate={new Date()}
        />
        <SingleSelectInput
          label="Nationality"
          options={NATIONALITY}
          value={watch("nationality_id")}
          onChange={(option) => handleChange("nationality_id", option)}
          error={errors.nationality_id?.message}
          clearError={() => clearErrors("nationality_id")}
          disabled={isDisabled}
        />
        <TextInput
          label="Address Line 1"
          value={watch("address1")}
          {...register("address1")}
          error={errors.address1?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Address Line 2"
          value={watch("address2")}
          {...register("address2")}
          error={errors.address2?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Postal Code"
          value={watch("postal_code")}
          {...register("postal_code")}
          error={errors.postal_code?.message}
          disabled={isDisabled}
          allowLetters={false}
        />
      </div>
    </>
  );
};

export default IndividualBookingForm;
