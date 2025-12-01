"use client";

import { useState, useEffect } from "react";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";
import NumberInput from "@/components/FormFields/NumberInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";

import useCustomersStore from "@/stores/customers/useCustomersStore";

const CompanyBookingForm = ({
  watch,
  errors,
  handleChange,
  setError,
  clearErrors,
  register,
  getValues,
  setValue,
}) => {
  const isDisabled = getValues("customer_id");

  const onCompanySelect = (option) => {
    // fill all the fields from option
    setValue("company_name", option?.company_name || "");
    setValue("contact_person", option?.contact_person || "");
    setValue("contact", option?.contact || "");
    setValue("email", option?.email || "");
    setValue("address1", option?.address1 || "");
    setValue("address2", option?.address2 || "");
    setValue("postal_code", option?.postal_code || "");
    setValue("nationality_id", option?.nationality_id?.toString() || "");
    setValue("country_id", option?.country_id || 1);
    setValue("trade_license_no", option?.trade_license_no || "");
    setValue("trade_license_expiry", option?.trade_license_expiry || "");
    setValue("contact_cnic", option?.contact_cnic || "");
    setValue("contact_cnic_expiry", option?.contact_cnic_expiry || "");
    setValue("trade_license", []);
    setValue("old_trade_license", option?.trade_license || []);
    setValue("owner_document", []);
    setValue("old_owner_document", option?.owner_document || []);

    clearErrors([
      "company_name",
      "contact_person",
      "contact",
      "email",
      "address1",
      "address2",
      "postal_code",
      "nationality_id",
      "country_id",
      "trade_license_no",
      "trade_license_expiry",
      "contact_cnic",
      "contact_cnic_expiry",
      "trade_license",
      "old_trade_license",
      "owner_document",
      "old_owner_document",
    ]);
  };

  const { customers, fetchCustomers } = useCustomersStore();

  useEffect(() => {
    // const body = {
    //   is_company: 1,
    // };
    fetchCustomers();
  }, [fetchCustomers]);

  const customer_id = watch("customer_id");
  const contact = watch("contact");
  const email = watch("email");
  const trade_license_no = watch("trade_license_no");
  const contact_cnic = watch("contact_cnic");

  useEffect(() => {
    if (customer_id) return;
    if (!customers?.length) return;

    const fieldsToCheck = {
      contact,
      email,
      trade_license_no,
      contact_cnic,
    };

    Object.entries(fieldsToCheck).forEach(([fieldName, fieldValue]) => {
      if (!fieldValue) {
        clearErrors(fieldName);
        return;
      }

      // ✅ only companies ke against check karna
      const isDuplicate = customers
        ?.filter((c) => c?.is_company === 1)
        ?.some((c) => String(c?.[fieldName]) === String(fieldValue));

      if (isDuplicate) {
        setError(fieldName, {
          type: "manual",
          message: `${fieldName.replaceAll("_", " ")} already exists`,
        });
      } else {
        clearErrors(fieldName);
      }
    });
  }, [
    contact,
    email,
    trade_license_no,
    contact_cnic,
    customers,
    setError,
    clearErrors,
  ]);

  return (
    <>
      <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
        Company Information
      </div>

      <SingleSelectInput
        label="Select Company"
        options={
          customers?.length ? customers?.filter((c) => c?.is_company === 1) : []
        }
        value={watch("customer_id")}
        onChange={(option) => handleChange("customer_id", option)}
        onSelect={onCompanySelect}
        error={errors.customer_id?.message}
        clearError={() => clearErrors("customer_id")}
      />
      <div className="space-y-2">
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Upload Trade License
          </div>
          <MultiImageUpload
            name="trade_license"
            accept={{
              "image/jpeg": [".jpeg", ".jpg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            value={watch("trade_license")}
            previewValues={watch("old_trade_license")}
            onChange={(val) => handleChange("trade_license", val)}
            setError={setError}
            error={errors?.trade_license?.message}
            disabled={isDisabled}
          />
        </div>
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Upload Owner Document
          </div>
          <MultiImageUpload
            name="owner_document"
            accept={{
              "image/jpeg": [".jpeg", ".jpg"],
              "image/png": [".png"],
              "image/webp": [".webp"],
            }}
            value={watch("owner_document")}
            previewValues={watch("old_owner_document")}
            onChange={(val) => handleChange("owner_document", val)}
            setError={setError}
            // setValue={setValue}
            error={errors?.owner_document?.message}
            disabled={isDisabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-8">
        <TextInput
          label="Company Name"
          value={watch("company_name")}
          {...register("company_name")}
          error={errors.company_name?.message}
          disabled={isDisabled}
        />
        <TextInput
          label="Contact Person"
          value={watch("contact_person")}
          {...register("contact_person")}
          error={errors.contact_person?.message}
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
        <SingleSelectInput
          label="Nationality"
          options={[
            { label: "American", value: "1" },
            { label: "Emirati", value: "2" },
          ]}
          value={watch("nationality_id")}
          onChange={(option) => handleChange("nationality_id", option)}
          error={errors.nationality_id?.message}
          clearError={() => clearErrors("nationality_id")}
          disabled={isDisabled}
        />
        <SingleSelectInput
          label="Country"
          options={[
            { label: "UAE", value: 1 },
            { label: "USA", value: 2 },
          ]}
          value={watch("country_id")}
          onChange={(option) => handleChange("country_id", option)}
          error={errors.country_id?.message}
          clearError={() => clearErrors("country_id")}
          disabled={isDisabled}
        />
        <TextInput
          label="Trade License Number"
          {...register("trade_license_no")}
          value={watch("trade_license_no")}
          error={errors.trade_license_no?.message}
          disabled={isDisabled}
          allowedSymbols="-"
        />
        <DatePickerInput
          label="Trade License Expiry Date"
          value={watch("trade_license_expiry")}
          onChange={(option) => handleChange("trade_license_expiry", option)}
          error={errors.trade_license_expiry?.message}
          clearError={() => clearErrors("trade_license_expiry")}
          disabled={isDisabled}
          minDate={new Date()}
        />
        <TextInput
          label="Contact CNIC"
          {...register("contact_cnic")}
          value={watch("contact_cnic")}
          error={errors.contact_cnic?.message}
          disabled={isDisabled}
          allowLetters={false}
          allowedSymbols="-"
        />
        <DatePickerInput
          label="Contact CNIC Expiry Date"
          value={watch("contact_cnic_expiry")}
          onChange={(option) => handleChange("contact_cnic_expiry", option)}
          error={errors.contact_cnic_expiry?.message}
          clearError={() => clearErrors("contact_cnic_expiry")}
          disabled={isDisabled}
          minDate={new Date()}
        />
      </div>
    </>
  );
};

export default CompanyBookingForm;
