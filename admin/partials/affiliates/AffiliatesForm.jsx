"use client";
import { useState, useEffect } from "react";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider as Form } from "react-hook-form";

import Button from "@/components/Button";
import TabManager from "@/components/TabManager";

import TextInput from "@/components/FormFields/TextInput";
import NumberInput from "@/components/FormFields/NumberInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import MultiImageUpload from "@/components/FormFields/MultiImageUpload";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import RadioSelectionButton from "@/components/FormFields/RadioSelectionButton";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { useDrawer } from "@/context/drawer-context";

import {
  AFFILIATE_TYPES,
  AFFILIATE_COMMISSION_TYPES,
  CURRENCIES,
} from "@/constants/rentify_constants";

import {
  ALLWOED_IMAGE_TYPES,
  ALLWOED_FILE_TYPES,
  COUNTRIES,
  STATES,
} from "@/constants/general_constants";

import useCommonStore from "@/stores/useCommonStore";

import useAffiliatesStore from "@/stores/rentify/affiliates/useAffiliatesStore";
import toast from "react-hot-toast";

// Helper function for file validation
const validateFile = (message = "File is required") =>
  z.any().refine((file) => {
    // If it's a string (URL from existing data), it's valid
    if (typeof file === "string" && file.length > 0) return true;
    // If it's a File object, check if it exists
    if (file instanceof File) return true;
    // Otherwise, it's invalid
    return false;
  }, message);

// Helper function for date validation that accepts both Date objects and ISO strings
const validateDate = (message = "Date is required") =>
  z
    .union([z.date(), z.string()])
    .refine((value) => {
      if (value instanceof Date) return true;
      if (typeof value === "string") {
        // Check if it's a valid ISO string or date string
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;
    }, message)
    .transform((value) => {
      // Convert to Date object for consistency
      // if (typeof value === 'string') return new Date(value);
      return value;
    });

// Base schema with common fields
/*
const baseSchema = z.object({
  id: z.number().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required").regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  email: z.email("Invalid email address"),
  city_id: z.string().min(1, "City/State is required"),
  country_id: z.string().min(1, "Country is required"),
  cnic_passport: z.string().min(1, "National ID/Passport is required"),
  cnic_passport_expiry: validateDate("Expiry date is required"),
  business_address: z.string().min(1, "Business address is required"),
  mailing_address: z.string().min(1, "Mailing address is required"),
  proof_of_address: validateFile("Proof of address is required"),
  insurance_certificate: validateFile("Insurance certificate is required"),
  bank_ac_verification_doc: validateFile("Bank account verification document is required"),
  type_id: z.string().min(1, "Type of affiliate is required"),
  vehicles_affiliated: z.string().min(1, "Number of vehicles must be at least 1"),
  comission_type_id: z.string().min(1, "Commission type is required"),
  currency_id: z.string().min(1, "Payment currency is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  ac_title: z.string().min(1, "Account holder name is required"),
  ac_number: z.string().min(1, "Account number is required"),
  swift_code: z.string().min(1, "SWIFT/BIC code is required"),
  payment_method_preference: z.string().min(1, "Payment method preference is required"),
  payment_terms: z.string().min(1, "Payment terms is required"),
  contract_start_date: validateDate("Contract start date is required"),
  contract_end_date: validateDate("Contract end date is required"),
  instructions: z.string().optional(),
  active: z.number().refine((val) => val === 0 || val === 1, "Status is required"),
});
*/

/*
// Base schema with common fields
const getBaseSchema = (record) =>
  z.object({
    id: z.number().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    email: z.string().email("Invalid email address"), // ✅ z.string().email()
    city_id: z.string().min(1, "City/State is required"),
    country_id: z.string().min(1, "Country is required"),
    cnic_passport: z.string().min(1, "National ID/Passport is required"),
    cnic_passport_expiry: validateDate("Expiry date is required"),
    business_address: z.string().min(1, "Business address is required"),
    mailing_address: z.string().min(1, "Mailing address is required"),

    proof_of_address: record?.old_proof_of_address?.length
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "Proof of address is required" }),
    old_proof_of_address: z.array(z.any()).optional(),

    insurance_certificate: record?.old_insurance_certificate?.length
      ? z.array(z.any())
      : z
          .array(z.any())
          .min(1, { message: "Insurance certificate is required" }),
    old_insurance_certificate: z.array(z.any()).optional(),

    bank_ac_verification_doc: record?.old_bank_ac_verification_doc?.length
      ? z.array(z.any())
      : z.array(z.any()).min(1, {
          message: "Bank account verification document is required",
        }),
    old_bank_ac_verification_doc: z.array(z.any()).optional(),

    type_id: z.string().min(1, "Affiliate type is required"),
    vehicles_affiliated: z
      .string()
      .min(1, "Number of vehicles must be at least 1"),
    comission_type_id: z.string().min(1, "Commission type is required"),
    currency_id: z.string().min(1, "Payment currency is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    ac_title: z.string().min(1, "Account holder name is required"),
    ac_number: z.string().min(1, "Account number is required"),
    swift_code: z.string().min(1, "SWIFT/BIC code is required"),
    payment_method_preference: z
      .string()
      .min(1, "Payment method preference is required"),
    payment_terms: z.string().min(1, "Payment terms is required"),
    contract_start_date: validateDate("Contract start date is required"),
    contract_end_date: validateDate("Contract end date is required"),
    instructions: z.string().optional(),
    active: z
      .number()
      .refine((val) => val === 0 || val === 1, "Status is required"),
  });

// Company-specific schema
const getCompanySchema = (record) =>
  getBaseSchema(record).extend({
    company_name: z.string().min(1, "Company name is required"),
    logo: z.union([z.string().optional(), z.instanceof(File).optional()]),
    old_logo: z.string().optional(),

    trade_license: record
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "Trade license is required" }),
    old_trade_license: z.array(z.any()).optional(),

    vat_certificate: record
      ? z.array(z.any())
      : z.array(z.any()).min(1, { message: "VAT certificate is required" }),
    old_vat_certificate: z.array(z.any()).optional(),

    trade_license_no: z.string().min(1, "Trade license number is required"),
    trade_license_expiry: validateDate("Trade license expiry date is required"),
    vat_registration_no: z
      .string()
      .min(1, "VAT registration number is required"),
    vat_registration_expiry: validateDate(
      "VAT registration expiry date is required"
    ),
    vehicle_capacity: z.string().min(1, "Vehicle capacity must be at least 1"),
  });

// Individual-specific schema
const getIndividualSchema = (record) =>
  getBaseSchema(record).extend({
    affiliate_image: z.union([
      z.string().optional(),
      z.instanceof(File).optional(),
    ]),
    old_affiliate_image: z.string().optional(),

    driving_license_no: z.string().min(1, "Driving license number is required"),
    driving_license_expiry: validateDate(
      "Driving license expiry date is required"
    ),
  });

// Conditional schema based on forCompany value
const createFormSchema = (forCompany, record) => {
  if (forCompany === "1") {
    return getCompanySchema(record);
  }
  return getIndividualSchema(record);
};
*/

// --- Base schema (sirf shape) ---
const getBaseSchema = () =>
  z.object({
    id: z.number().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    email: z.string().email("Invalid email address"),
    city_id: z.string().min(1, "City/State is required"),
    country_id: z.string().min(1, "Country is required"),
    cnic_passport: z.string().min(1, "National ID/Passport is required"),
    cnic_passport_expiry: validateDate("Expiry date is required"),
    business_address: z.string().min(1, "Business address is required"),
    mailing_address: z.string().min(1, "Mailing address is required"),

    proof_of_address: z.array(z.any()).optional(),
    old_proof_of_address: z.array(z.any()).optional(),

    insurance_certificate: z.array(z.any()).optional(),
    old_insurance_certificate: z.array(z.any()).optional(),

    bank_ac_verification_doc: z.array(z.any()).optional(),
    old_bank_ac_verification_doc: z.array(z.any()).optional(),

    type_id: z.string().min(1, "Affiliate type is required"),
    vehicles_affiliated: z
      .string()
      .min(1, "Number of vehicles must be at least 1"),
    comission_type_id: z.string().min(1, "Commission type is required"),
    currency_id: z.string().min(1, "Payment currency is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    ac_title: z.string().min(1, "Account holder name is required"),
    ac_number: z.string().min(1, "Account number is required"),
    swift_code: z.string().min(1, "SWIFT/BIC code is required"),
    payment_method_preference: z
      .string()
      .min(1, "Payment method preference is required"),
    payment_terms: z.string().min(1, "Payment terms is required"),
    contract_start_date: validateDate("Contract start date is required"),
    contract_end_date: validateDate("Contract end date is required"),
    instructions: z.string().optional(),
    active: z
      .number()
      .refine((val) => val === 0 || val === 1, "Status is required"),
  });

// --- Company schema (sirf extra fields) ---
const getCompanySchema = () =>
  getBaseSchema().extend({
    company_name: z.string().min(1, "Company name is required"),
    logo: z.union([z.string().optional(), z.instanceof(File).optional()]),
    old_logo: z.string().optional(),

    trade_license: z.array(z.any()).optional(),
    old_trade_license: z.array(z.any()).optional(),

    vat_certificate: z.array(z.any()).optional(),
    old_vat_certificate: z.array(z.any()).optional(),

    trade_license_no: z.string().min(1, "Trade license number is required"),
    trade_license_expiry: validateDate("Trade license expiry date is required"),
    vat_registration_no: z
      .string()
      .min(1, "VAT registration number is required"),
    vat_registration_expiry: validateDate(
      "VAT registration expiry date is required"
    ),
    vehicle_capacity: z.string().min(1, "Vehicle capacity must be at least 1"),
  });

// --- Individual schema (sirf extra fields) ---
const getIndividualSchema = () =>
  getBaseSchema().extend({
    affiliate_image: z.union([
      z.string().optional(),
      z.instanceof(File).optional(),
    ]),
    old_affiliate_image: z.string().optional(),

    driving_license_no: z.string().min(1, "Driving license number is required"),
    driving_license_expiry: validateDate(
      "Driving license expiry date is required"
    ),
  });

// --- Helper for file validation ---
const validateFileField = (ctx, data, field, oldField, message) => {
  const hasNew = data[field] && data[field].length > 0;
  const hasOld = data[oldField] && data[oldField].length > 0;

  if (!hasNew && !hasOld) {
    ctx.addIssue({
      code: "custom",
      path: [field],
      message,
    });
  }
};

const validateSingleFileField = (ctx, data, field, oldField, message) => {
  const hasNew =
    data[field] &&
    (data[field] instanceof File || typeof data[field] === "string");
  const hasOld =
    data[oldField] &&
    (data[oldField] instanceof File || typeof data[oldField] === "string");

  if (!hasNew && !hasOld) {
    ctx.addIssue({
      code: "custom",
      path: [field],
      message,
    });
  }
};

// --- Create final schema with superRefine ---
const createFormSchema = (forCompany) => {
  let schema = forCompany === "1" ? getCompanySchema() : getIndividualSchema();

  return schema.superRefine((data, ctx) => {
    // common fields
    validateFileField(
      ctx,
      data,
      "proof_of_address",
      "old_proof_of_address",
      "Proof of address is required"
    );
    validateFileField(
      ctx,
      data,
      "insurance_certificate",
      "old_insurance_certificate",
      "Insurance certificate is required"
    );
    validateFileField(
      ctx,
      data,
      "bank_ac_verification_doc",
      "old_bank_ac_verification_doc",
      "Bank account verification document is required"
    );

    // company-only fields
    if (forCompany === "1") {
      validateFileField(
        ctx,
        data,
        "trade_license",
        "old_trade_license",
        "Trade license is required"
      );
      validateFileField(
        ctx,
        data,
        "vat_certificate",
        "old_vat_certificate",
        "VAT certificate is required"
      );
    }

    // individual-only fields
    if (forCompany !== "1") {
      validateSingleFileField(
        ctx,
        data,
        "affiliate_image",
        "old_affiliate_image",
        "Affiliate image is required"
      );
    }
  });
};

export default function AffiliatesForm({ record }) {
  const [forCompany, setForCompany] = useState(
    record?.is_company?.toString() || "0"
  );

  // Create schema based on forCompany state
  const formSchema = createFormSchema(forCompany);

  const { saveAffiliate, updateAffiliate } = useAffiliatesStore();

  const {
    countries,
    countriesLoading,
    citiesLoading,
    fetchCountries,
    fetchCities,
    getCitiesByCountryId,
  } = useCommonStore();
  const [cities, setCities] = useState(null);

  const { hideDrawer } = useDrawer();

  const getSafeArray = (value, defaultValue = []) => {
    return Array.isArray(value) && value.length > 0 ? value : defaultValue;
  };

  const defaultValues = {
    id: record?.id || 0,
    first_name: record?.first_name || "",
    last_name: record?.last_name || "",
    phone: record?.phone || "",
    email: record?.email || "",
    city_id: record?.city_id?.toString() || "",
    country_id: record?.country_id?.toString() || "",
    cnic_passport: record?.cnic_passport || "",
    cnic_passport_expiry: record?.cnic_passport_expiry
      ? new Date(record.cnic_passport_expiry)
      : null,
    business_address: record?.business_address || "",
    mailing_address: record?.mailing_address || "",
    proof_of_address: [],
    old_proof_of_address: getSafeArray(
      record?.old_proof_of_address,
      getSafeArray(record?.proof_of_address, [])
    ),
    // old_proof_of_address: record?.old_proof_of_address?.length
    //   ? record?.old_proof_of_address
    //   : [],
    insurance_certificate: [],
    old_insurance_certificate: getSafeArray(
      record?.old_insurance_certificate,
      getSafeArray(record?.insurance_certificate, [])
    ),
    // old_insurance_certificate: record?.old_insurance_certificate?.length
    //   ? record?.old_insurance_certificate
    //   : [],
    bank_ac_verification_doc: [],
    old_bank_ac_verification_doc: getSafeArray(
      record?.old_bank_ac_verification_doc,
      getSafeArray(record?.bank_ac_verification_doc, [])
    ),
    // old_bank_ac_verification_doc: record?.old_bank_ac_verification_doc?.length
    //   ? record?.old_bank_ac_verification_doc
    //   : [],
    type_id: record?.type_id?.toString() || "",
    vehicles_affiliated: record?.vehicles_affiliated?.toString() || "",
    comission_type_id: record?.comission_type_id?.toString() || "",
    currency_id: record?.currency_id?.toString() || "",
    bank_name: record?.bank_name || "",
    ac_title: record?.ac_title || "",
    ac_number: record?.ac_number || "",
    swift_code: record?.swift_code || "",
    payment_method_preference: record?.payment_method_preference || "",
    payment_terms: record?.payment_terms || "",
    contract_start_date: record?.contract_start_date
      ? new Date(record.contract_start_date)
      : null,
    contract_end_date: record?.contract_end_date
      ? new Date(record.contract_end_date)
      : null,
    instructions: record?.instructions || "",
    active: record?.active !== undefined ? record.active : 0,
    // Company-specific fields
    company_name: record?.company_name || "",
    logo: "",
    old_logo: record?.logo || "",
    trade_license: [],
    old_trade_license: getSafeArray(
      record?.old_trade_license,
      getSafeArray(record?.trade_license, [])
    ),
    // old_trade_license: record?.old_trade_license?.length
    //   ? record?.old_trade_license
    //   : [],
    vat_certificate: [],
    old_vat_certificate: getSafeArray(
      record?.old_vat_certificate,
      getSafeArray(record?.vat_certificate, [])
    ),
    // old_vat_certificate: record?.old_vat_certificate?.length
    //   ? record?.old_vat_certificate
    //   : [],
    trade_license_no: record?.trade_license_no || "",
    trade_license_expiry: record?.trade_license_expiry
      ? new Date(record.trade_license_expiry)
      : null,
    vat_registration_no: record?.vat_registration_no || "",
    vat_registration_expiry: record?.vat_registration_expiry
      ? new Date(record.vat_registration_expiry)
      : null,
    vehicle_capacity: String(record?.vehicle_capacity) || "",
    // Individual-specific fields
    affiliate_image: "",
    old_affiliate_image: record?.affiliate_image || "",
    driving_license_no: record?.driving_license_no || "",
    driving_license_expiry: record?.driving_license_expiry
      ? new Date(record.driving_license_expiry)
      : null,
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
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    fetchCountries();
    fetchCities();
  }, [fetchCountries, fetchCities]);

  // CONVERT TO SLUG - starting
  const selectedCountry = watch("country_id");
  // console.log(selectedCountry)
  // console.log(cities)
  // useEffect(() => {
  //   setCities([]);
  //   if (!selectedCountry) return;
  //   setCities(getDropdownFormattedData(getCitiesByCountryId(selectedCountry)));
  // }, [selectedCountry, setCities]);
  // CONVERT TO SLUG - ending

  const onSubmit = async (formData) => {
    try {
      const {
        proof_of_address,
        insurance_certificate,
        bank_ac_verification_doc,
        trade_license,
        vat_certificate,
        ...restFormData
      } = formData || {}; // Exclude images
      const body = {
        ...restFormData,
        is_company: Number(forCompany),
        logo: forCompany === "1" ? formData?.logo : "",
        affiliate_image: forCompany === "0" ? formData?.affiliate_image : "",

        proof_of_address_qty: proof_of_address?.length || 0,
        insurance_certificate_qty: insurance_certificate?.length || 0,
        bank_ac_verification_doc_qty: bank_ac_verification_doc?.length || 0,
        trade_license_qty: trade_license?.length || 0,
        vat_certificate_qty: vat_certificate?.length || 0,

        ...(proof_of_address || []).reduce((acc, img, index) => {
          acc[`proof_of_address_${index}`] = img;
          return acc;
        }, {}),

        ...(insurance_certificate || []).reduce((acc, img, index) => {
          acc[`insurance_certificate_${index}`] = img;
          return acc;
        }, {}),

        ...(bank_ac_verification_doc || []).reduce((acc, img, index) => {
          acc[`bank_ac_verification_doc_${index}`] = img;
          return acc;
        }, {}),

        ...(trade_license || []).reduce((acc, img, index) => {
          acc[`trade_license_${index}`] = img;
          return acc;
        }, {}),

        ...(vat_certificate || []).reduce((acc, img, index) => {
          acc[`vat_certificate_${index}`] = img;
          return acc;
        }, {}),
      };

      const response = await POST(
        rentify_endpoints?.rentify?.affiliates?.save,
        body
      );

      if (response?.status === 200) {
        toast.success("Record Saved");
        if (formData && formData?.id) {
          updateAffiliate(response?.data || formData);
        } else {
          saveAffiliate(response?.data || formData);
        }
        hideDrawer();
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

  // Update schema when forCompany changes
  const handleTabChange = (key) => {
    setForCompany(key);
    // Reset form with new schema
    methods.reset(defaultValues);
  };

  //const getDeleteUrl = (id) => { return rentify_endpoints?.rentify?.affiliates?.deleteOldImage(id) };
  const getOldImageDeleteUrl = (id) =>
    rentify_endpoints?.rentify?.affiliates?.deleteOldImage(id);

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
        <TabManager
          availableTabs={null}
          initialTabs={
            record?.id
              ? record?.is_company
                ? [{ key: "1", label: "Company Affiliates" }]
                : [{ key: "0", label: "Individual Affiliates" }]
              : [
                  { key: "0", label: "Individual Affiliates" },
                  { key: "1", label: "Company Affiliates" },
                ]
          }
          initialActive={forCompany}
          allowClose={false}
          showAddView={false}
          onTabChange={handleTabChange}
        />
        {forCompany !== "0" ? (
          <>
            <div className="space-y-2">
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Company Logo / Rep Photo
                </div>
                <SingleUpload2
                  name="logo"
                  accept={ALLWOED_IMAGE_TYPES}
                  value={record ? watch("old_logo") : watch("logo")}
                  onChange={(val) => handleChange("logo", val)}
                  setError={setError}
                  error={errors?.logo?.message}
                  onRemove={() => setValue("old_logo", "")}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Upload Trade License
                </div>
                <MultiImageUpload
                  name="trade_license"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("trade_license")}
                  previewValues={watch("old_trade_license")}
                  onChange={(val) => handleChange("trade_license", val)}
                  onRemove={(val) => handleChange("old_trade_license", val)}
                  setError={setError}
                  error={errors?.trade_license?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  VAT Certificate / Tax Documents
                </div>
                <MultiImageUpload
                  name="vat_certificate"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("vat_certificate")}
                  previewValues={watch("old_vat_certificate")}
                  onChange={(val) => handleChange("vat_certificate", val)}
                  onRemove={(val) => handleChange("old_vat_certificate", val)}
                  setError={setError}
                  error={errors?.vat_certificate?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Proof of Address
                </div>
                <MultiImageUpload
                  name="proof_of_address"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("proof_of_address")}
                  previewValues={watch("old_proof_of_address")}
                  onChange={(val) => handleChange("proof_of_address", val)}
                  onRemove={(val) => handleChange("old_proof_of_address", val)}
                  setError={setError}
                  error={errors?.proof_of_address?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Insurance Certificate
                </div>
                <MultiImageUpload
                  name="insurance_certificate"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("insurance_certificate")}
                  previewValues={watch("old_insurance_certificate")}
                  onChange={(val) => handleChange("insurance_certificate", val)}
                  onRemove={(val) =>
                    handleChange("old_insurance_certificate", val)
                  }
                  setError={setError}
                  error={errors?.insurance_certificate?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Bank Account Verification Document
                </div>
                <MultiImageUpload
                  name="bank_ac_verification_doc"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("bank_ac_verification_doc")}
                  previewValues={watch("old_bank_ac_verification_doc")}
                  onChange={(val) =>
                    handleChange("bank_ac_verification_doc", val)
                  }
                  onRemove={(val) =>
                    handleChange("old_bank_ac_verification_doc", val)
                  }
                  setError={setError}
                  error={errors?.bank_ac_verification_doc?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
            </div>

            <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
              Company Information
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-8">
              <TextInput
                label="Representative First Name"
                error={errors.first_name?.message}
                value={watch("first_name")}
                {...register("first_name")}
              />
              <TextInput
                label="Representative Last Name"
                error={errors.last_name?.message}
                value={watch("last_name")}
                {...register("last_name")}
              />
              <TextInput
                label="Company Name"
                error={errors.company_name?.message}
                value={watch("company_name")}
                {...register("company_name")}
              />
              <TextInput
                label="Phone No"
                error={errors.phone?.message}
                value={watch("phone")}
                {...register("phone")}
                allowLetters={false}
                allowedSymbols="-+()"
              />
              <TextInput
                label="Email Address"
                type="email"
                error={errors.email?.message}
                value={watch("email")}
                {...register("email")}
              />
              <SingleSelectInput
                label="Country"
                //options={getDropdownFormattedData(countries)}
                options={COUNTRIES}
                value={watch("country_id")}
                {...register("country_id")}
                onChange={(option) => handleChange("country_id", option)}
                error={errors.country_id?.message}
                clearError={() => clearErrors("country_id")}
              />
              <SingleSelectInput
                label="City / State"
                //options={getDropdownFormattedData(getCitiesByCountryId(selectedCountry))}
                options={STATES}
                value={watch("city_id")}
                {...register("city_id")}
                onChange={(option) => handleChange("city_id", option)}
                error={errors.city_id?.message}
                clearError={() => clearErrors("city_id")}
              />

              <TextInput
                label="National ID / Passport Number"
                error={errors.cnic_passport?.message}
                value={watch("cnic_passport")}
                {...register("cnic_passport")}
                allowedSymbols="-"
              />
              <DatePickerInput
                label="National ID / Passport Expiry Date"
                value={watch("cnic_passport_expiry")}
                {...register("cnic_passport_expiry")}
                onChange={(option) =>
                  handleChange("cnic_passport_expiry", option)
                }
                error={errors.cnic_passport_expiry?.message}
                clearError={() => clearErrors("cnic_passport_expiry")}
                minDate={new Date()}
              />
              <TextInput
                label="Business Address"
                error={errors.business_address?.message}
                value={watch("business_address")}
                {...register("business_address")}
              />
              <TextInput
                label="Mailing Address"
                error={errors.mailing_address?.message}
                value={watch("mailing_address")}
                {...register("mailing_address")}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Upload Affiliate Picture
                </div>
                <SingleUpload2
                  name="affiliate_image"
                  accept={ALLWOED_IMAGE_TYPES}
                  value={
                    record
                      ? watch("old_affiliate_image")
                      : watch("affiliate_image")
                  }
                  onChange={(val) => handleChange("affiliate_image", val)}
                  onRemove={(val) => handleChange("old_affiliate_image", val)}
                  setError={setError}
                  error={errors?.affiliate_image?.message}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Proof of Address
                </div>
                <MultiImageUpload
                  name="proof_of_address"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("proof_of_address")}
                  previewValues={watch("old_proof_of_address")}
                  onChange={(val) => handleChange("proof_of_address", val)}
                  onRemove={(val) => handleChange("old_proof_of_address", val)}
                  setError={setError}
                  error={errors?.proof_of_address?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Insurance Certificate
                </div>
                <MultiImageUpload
                  name="insurance_certificate"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("insurance_certificate")}
                  previewValues={watch("old_insurance_certificate")}
                  onChange={(val) => handleChange("insurance_certificate", val)}
                  onRemove={(val) =>
                    handleChange("old_insurance_certificate", val)
                  }
                  setError={setError}
                  error={errors?.insurance_certificate?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
              <div>
                <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
                  Bank Account Verification Document
                </div>
                <MultiImageUpload
                  name="bank_ac_verification_doc"
                  accept={ALLWOED_FILE_TYPES}
                  value={watch("bank_ac_verification_doc")}
                  previewValues={watch("old_bank_ac_verification_doc")}
                  onChange={(val) =>
                    handleChange("bank_ac_verification_doc", val)
                  }
                  onRemove={(val) =>
                    handleChange("old_bank_ac_verification_doc", val)
                  }
                  setError={setError}
                  error={errors?.bank_ac_verification_doc?.message}
                  deleteOldImageUrl={getOldImageDeleteUrl}
                />
              </div>
            </div>

            <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
              Client Information
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-8">
              <TextInput
                label="First Name"
                error={errors.first_name?.message}
                value={watch("first_name")}
                {...register("first_name")}
              />
              <TextInput
                label="Last Name"
                error={errors.last_name?.message}
                value={watch("last_name")}
                {...register("last_name")}
              />
              <TextInput
                label="Phone No"
                error={errors.phone?.message}
                value={watch("phone")}
                {...register("phone")}
                allowLetters={false}
                allowedSymbols="-+()"
              />
              <TextInput
                label="Email Address"
                type="email"
                error={errors.email?.message}
                value={watch("email")}
                {...register("email")}
              />
              <SingleSelectInput
                label="Country"
                options={COUNTRIES}
                value={watch("country_id")}
                {...register("country_id")}
                onChange={(option) => handleChange("country_id", option)}
                error={errors.country_id?.message}
                clearError={() => clearErrors("country_id")}
                loading={countriesLoading}
              />
              <SingleSelectInput
                label="City / State"
                options={STATES}
                value={watch("city_id")}
                {...register("city_id")}
                onChange={(option) => handleChange("city_id", option)}
                error={errors.city_id?.message}
                clearError={() => clearErrors("city_id")}
                loading={citiesLoading}
              />
              <TextInput
                label="Driving License Number"
                error={errors.driving_license_no?.message}
                value={watch("driving_license_no")}
                {...register("driving_license_no")}
                allowedSymbols="-"
              />
              <DatePickerInput
                label="Driving License Expiry Date"
                value={watch("driving_license_expiry")}
                {...register("driving_license_expiry")}
                onChange={(option) =>
                  handleChange("driving_license_expiry", option)
                }
                error={errors.driving_license_expiry?.message}
                clearError={() => clearErrors("driving_license_expiry")}
                minDate={new Date()}
              />
              <TextInput
                label="National ID / Passport Number"
                error={errors.cnic_passport?.message}
                value={watch("cnic_passport")}
                {...register("cnic_passport")}
                allowedSymbols="-"
              />
              <DatePickerInput
                label="National ID / Passport Expiry Date"
                value={watch("cnic_passport_expiry")}
                {...register("cnic_passport_expiry")}
                onChange={(option) =>
                  handleChange("cnic_passport_expiry", option)
                }
                error={errors.cnic_passport_expiry?.message}
                clearError={() => clearErrors("cnic_passport_expiry")}
                minDate={new Date()}
              />
              <TextInput
                label="Business Address"
                error={errors.business_address?.message}
                value={watch("business_address")}
                {...register("business_address")}
              />
              <TextInput
                label="Mailing Address"
                error={errors.mailing_address?.message}
                value={watch("mailing_address")}
                {...register("mailing_address")}
              />
            </div>
          </>
        )}

        <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
          Business & Legal Details
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-8">
          {forCompany !== "0" && (
            <>
              <TextInput
                label="Trade License Number"
                error={errors.trade_license_no?.message}
                value={watch("trade_license_no")}
                {...register("trade_license_no")}
                allowedSymbols="-"
              />
              <DatePickerInput
                label="Trade License Expiry Date"
                value={watch("trade_license_expiry")}
                {...register("trade_license_expiry")}
                onChange={(option) =>
                  handleChange("trade_license_expiry", option)
                }
                error={errors.trade_license_expiry?.message}
                clearError={() => clearErrors("trade_license_expiry")}
                minDate={new Date()}
              />
              <TextInput
                label="VAT Registration Number"
                error={errors.vat_registration_no?.message}
                value={watch("vat_registration_no")}
                {...register("vat_registration_no")}
                allowedSymbols="-"
              />
              <DatePickerInput
                label="VAT Registration Expiry Date"
                value={watch("vat_registration_expiry")}
                {...register("vat_registration_expiry")}
                onChange={(option) =>
                  handleChange("vat_registration_expiry", option)
                }
                error={errors.vat_registration_expiry?.message}
                clearError={() => clearErrors("vat_registration_expiry")}
                minDate={new Date()}
              />
            </>
          )}
          <SingleSelectInput
            label="Type of Affiliate"
            options={AFFILIATE_TYPES}
            value={watch("type_id")}
            {...register("type_id")}
            onChange={(option) => handleChange("type_id", option)}
            error={errors.type_id?.message}
            clearError={() => clearErrors("type_id")}
          />
          <NumberInput
            label="Number of Vehicles Affiliated"
            placeholder=""
            value={watch("vehicles_affiliated")}
            error={errors.vehicles_affiliated?.message}
            {...register("vehicles_affiliated")}
          />
          <SingleSelectInput
            label="Commission Type"
            options={AFFILIATE_COMMISSION_TYPES}
            value={watch("comission_type_id")}
            {...register("comission_type_id")}
            onChange={(option) => handleChange("comission_type_id", option)}
            error={errors.comission_type_id?.message}
            clearError={() => clearErrors("comission_type_id")}
          />
          <SingleSelectInput
            label="Payment Currency"
            options={CURRENCIES}
            value={watch("currency_id")}
            {...register("currency_id")}
            onChange={(option) => handleChange("currency_id", option)}
            error={errors.currency_id?.message}
            clearError={() => clearErrors("currency_id")}
          />
          <TextInput
            label="Bank Name"
            error={errors.bank_name?.message}
            value={watch("bank_name")}
            {...register("bank_name")}
          />
          <TextInput
            label="Account Holder Name"
            error={errors.ac_title?.message}
            value={watch("ac_title")}
            {...register("ac_title")}
          />
          <TextInput
            label="Account Number / IBAN"
            error={errors.ac_number?.message}
            value={watch("ac_number")}
            {...register("ac_number")}
            maxLength={35}
            allowLetters={true}
            allowNumbers={true}
            allowedSymbols=""
          />
          <TextInput
            label="SWIFT / BIC Code"
            error={errors.swift_code?.message}
            value={watch("swift_code")}
            {...register("swift_code")}
            allowLetters={true}
            allowNumbers={true}
            allowedSymbols=""
          />
          <TextInput
            label="Payment Method Preference"
            error={errors.payment_method_preference?.message}
            value={watch("payment_method_preference")}
            {...register("payment_method_preference")}
          />
          <TextInput
            label="Payment Terms"
            error={errors.payment_terms?.message}
            value={watch("payment_terms")}
            {...register("payment_terms")}
          />
        </div>

        <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
          Contract & Operational Details
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-8">
          <DatePickerInput
            label="Contract Start Date"
            value={watch("contract_start_date")}
            {...register("contract_start_date")}
            onChange={(option) => handleChange("contract_start_date", option)}
            error={errors.contract_start_date?.message}
            clearError={() => clearErrors("contract_start_date")}
            minDate={new Date()}
          />
          <DatePickerInput
            label="Contract End Date"
            value={watch("contract_end_date")}
            {...register("contract_end_date")}
            onChange={(option) => handleChange("contract_end_date", option)}
            error={errors.contract_end_date?.message}
            clearError={() => clearErrors("contract_end_date")}
            minDate={watch("contract_start_date") || new Date()}
          />
          {forCompany !== "0" && (
            <NumberInput
              label="Max Vehicle Capacity"
              error={errors.vehicle_capacity?.message}
              {...register("vehicle_capacity")}
            />
          )}
        </div>
        <TextInput
          label="Notes / Special Instructions"
          error={errors.instructions?.message}
          value={watch("instructions")}
          {...register("instructions")}
        />
        <RadioSelectionButton
          options={[
            { label: "Active", value: 1 },
            { label: "Inactive", value: 0 },
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
      </form>
    </Form>
  );
}
