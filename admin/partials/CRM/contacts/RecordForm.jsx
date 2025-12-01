"use client";

import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";

import useContactsStore from "@/stores/crm/useContactsStore";
import { useDrawer } from "@/context/drawer-context";

import {
  CONTACTS_STATUS_OPTIONS,
  CONTACTS_SOURCES_OPTIONS,
} from "@/constants/crm_constants";
import { COUNTRIES, STATES, USER_ROLES } from "@/constants/general_constants";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import useAccountsStore from "@/stores/crm/useAccountsStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";

export default function RecordForm({ record = {} }) {
  const { hideDrawer } = useDrawer();

  const saveRecord = useContactsStore((s) => s.saveRecord);
  const updateRecord = useContactsStore((s) => s.updateRecord);

  const accounts = useAccountsStore((s) => s.records);
  const fetchAccounts = useAccountsStore((s) => s.fetchRecords);
  const accountsLoading = useAccountsStore((s) => s.recordsLoading);

  const systemUsers = useSystemUsersStore((s) => s.systemUsers);
  const fetchSystemUsers = useSystemUsersStore((s) => s.fetchSystemUsers);
  const [users, setUsers] = useState(null);

  // Default Form Values
  const defaultValues = useMemo(() => FormValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { isSubmitting, errors },
  } = methods;

  const handleChange = (name, value) => setValue(name, value);

  // Fetch Data
  useEffect(() => {
    fetchSystemUsers();
    fetchAccounts();
  }, []);
  useEffect(() => {
    setUsers(
      systemUsers?.map((user) => ({
        value: String(user?.id), // or user.id (depending on your backend)
        label: String(
          user?.first_name + " " + user?.last_name + " (" + user?.email + ")"
        ), // display name in dropdown
      }))
    );
  }, [systemUsers]);

  // Submit
  const onSubmit = async (formData) => {
    try {
      const body = { ...formData, deletable: 0 };

//console.log("body 81"); console.log(body); return false;
 
      if (formData?.id) {
        await updateRecord(body, { onSuccess: () => hideDrawer() });
      } else {
        await saveRecord(body, { onSuccess: () => hideDrawer() });
      }
      //reset();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };


  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <h2 className="text-md font-semibold text-gray-800 mb-6">
          Contact Information
        </h2>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner */}
          <SingleSelectInput
            label="Contact Owner"
            options={users}
            value={watch("owner_id")}
            onChange={(option) => handleChange("owner_id", option)}
            error={errors.owner_id?.message}
            clearError={() => clearErrors("owner_id")}
          />

          {/* Owner */}
          <SingleSelectInput
            label="Assigned To"
            options={users}
            value={watch("assigned_to_id")}
            onChange={(option) => handleChange("assigned_to_id", option)}
            error={errors.assigned_to_id?.message}
            clearError={() => clearErrors("assigned_to_id")}
          />

          {/* Title */}
          <TextInput
            label="Contact Title"
            type="text"
            value={watch("title")}
            error={errors.title?.message}
            {...register("title")}
            maxLength={100}
          />

          {/* Contact Source */}
          <SingleSelectInput
            label="Source"
            options={CONTACTS_SOURCES_OPTIONS}
            value={watch("source_id")}
            onChange={(option) => handleChange("source_id", option)}
            error={errors.source_id?.message}
            clearError={() => clearErrors("source_id")}
          />

          {/* First Name */}
          <TextInput
            label="First Name"
            type="text"
            value={watch("first_name")}
            error={errors.first_name?.message}
            {...register("first_name")}
            maxLength={50}
          />

          {/* Last Name */}
          <TextInput
            label="Last Name"
            type="text"
            value={watch("last_name")}
            error={errors.last_name?.message}
            {...register("last_name")}
            maxLength={50}
          />

          {/* Email */}
          <TextInput
            label="Email"
            type="text"
            value={watch("email")}
            error={errors.email?.message}
            {...register("email")}
            maxLength={100}
          />

          {/* Account Name */}
          <SingleSelectInput
            label="Account Name"
            options={getDropdownFormattedData(accounts)}
            value={watch("account_id")}
            onChange={(option) => handleChange("account_id", option)}
            error={errors.account_id?.message}
            clearError={() => clearErrors("account_id")}
            loading={accountsLoading}
          />

          {/* Contact Role */}
          <SingleSelectInput
            label="Contact Role"
            options={USER_ROLES}
            value={watch("role_id")}
            onChange={(option) => handleChange("role_id", option)}
            error={errors.role_id?.message}
            clearError={() => clearErrors("role_id")}
          />

          {/* Status */}
          <SingleSelectInput
            label="Status"
            options={CONTACTS_STATUS_OPTIONS}
            value={watch("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />

          {/* Website */}
          <TextInput
            label="Website"
            type="text"
            value={watch("website")}
            error={errors.website?.message}
            {...register("website")}
            maxLength={150}
          />

          {/* Phone */}
          <TextInput
            label="Phone"
            type="text"
            value={watch("phone")}
            error={errors.phone?.message}
            {...register("phone")}
            maxLength={20}
          />

          {/* Mobile */}
          <TextInput
            label="Mobile"
            type="text"
            value={watch("mobile")}
            error={errors.mobile?.message}
            {...register("mobile")}
            maxLength={20}
          />

          {/* Fax */}
          <TextInput
            label="Fax"
            type="text"
            value={watch("fax")}
            error={errors.fax?.message}
            {...register("fax")}
            maxLength={20}
          />

          {/* Address Line 1 */}
          <TextInput
            label="Address Line 1"
            type="text"
            value={watch("address1")}
            error={errors.address1?.message}
            {...register("address1")}
            maxLength={150}
          />

          {/* Address Line 2 */}
          <TextInput
            label="Address Line 2"
            type="text"
            value={watch("address2")}
            error={errors.address2?.message}
            {...register("address2")}
            maxLength={150}
          />

          {/* Country */}
          <SingleSelectInput
            label="Country"
            options={COUNTRIES}
            value={watch("country_id")}
            onChange={(option) => handleChange("country_id", option)}
            error={errors.country_id?.message}
            clearError={() => clearErrors("country_id")}
          />

          {/* State */}
          <SingleSelectInput
            label="State"
            options={STATES}
            value={watch("state_id")}
            onChange={(option) => handleChange("state_id", option)}
            error={errors.state_id?.message}
            clearError={() => clearErrors("state_id")}
          />

          {/* Postal Code */}
          <TextInput
            label="Postal Code"
            type="text"
            value={watch("postal_code")}
            error={errors.postal_code?.message}
            {...register("postal_code")}
          />
        </div>
        <div>
          {/* Description */}
          <TextInput
            label="Description"
            type="text"
            value={watch("description")}
            error={errors.description?.message}
            {...register("description")}
            maxLength={500}
          />
        </div>

        {/* Footer */}
        <div className="pt-8 flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => hideDrawer()}
          >
            Cancel
          </Button>
          <Button type="submit" isSubmitting={isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

/* -------------------------------
 * Default Values
 * ----------------------------- */
/* -------------------------------
 * Default Values
 * ----------------------------- */
export const FormValues = (record = {}) => ({
  id: record?.id ?? 0,
  title: record?.title ?? "",

  owner_id: record?.owner_id?.toString() ?? "",
  assigned_to_id: record?.assigned_to_id?.toString() ?? "",

  source_id: record?.source_id?.toString() ?? "",
  first_name: record?.first_name ?? "",
  last_name: record?.last_name ?? "",

  email: record?.email ?? "",
  account_id: record?.account_id?.toString() ?? "",
  role_id: record?.role_id?.toString() ?? "",
  status_id: record?.status_id?.toString() ?? "",

  website: record?.website ?? "",
  phone: record?.phone ?? "",
  mobile: record?.mobile ?? "",
  fax: record?.fax ?? "",
  description: record?.description ?? "",

  address1: record?.address1 ?? "",
  address2: record?.address2 ?? "",
  country_id: record?.country_id?.toString() ?? "",
  state_id: record?.state_id?.toString() ?? "",
  postal_code: record?.postal_code ?? "",
});

/* -------------------------------
 * Validation Schema
 * ----------------------------- */
/* -------------------------------
 * Validation Schema
 * ----------------------------- */
const requiredString = (field) =>
  z.string().min(1, { message: `${field} is required` });

export const FormSchema = z
  .object({
    id: z.number().default(0),
/*
    title: requiredString("Contact Title"),
    owner_id: requiredString("Contact Owner"),
    assigned_to_id: requiredString("Assigned To"),
    source_id: requiredString("Contact Source"),
    first_name: requiredString("First Name"),
    last_name: requiredString("Last Name"),
*/
    title: z.string().optional().or(z.literal("")),

    owner_id: z.string().optional().or(z.literal("")),
    assigned_to_id: z.string().optional().or(z.literal("")),

    source_id: z.string().optional().or(z.literal("")),

    first_name: z.string().optional().or(z.literal("")),
    last_name: z.string().optional().or(z.literal("")),

    email: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Invalid email address" }
      ),

    account_id: z.string().optional().or(z.literal("")),
    role_id: z.string().optional().or(z.literal("")),
    status_id: z.string().optional().or(z.literal("")),

    website: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    mobile: z.string().optional().or(z.literal("")),
    fax: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    address1: z.string().optional().or(z.literal("")),
    address2: z.string().optional().or(z.literal("")),
    country_id: z.string().optional().or(z.literal("")),
    state_id: z.string().optional().or(z.literal("")),
    postal_code: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      return (
        !!data.phone?.trim() ||
        !!data.mobile?.trim() ||
        !!data.website?.trim() ||
        !!data.email?.trim()
      );
    },
    {
      message:
        "At least one of Phone, Mobile, Website, or Email must be provided.",
      path: ["phone"], // 👈 the field to show the error under (can be any)
    }
  );



/*
export const FormSchema = z.object({
  id: z.number().default(0),

  title: requiredString("Contact Title"),

  owner_id: requiredString("Contact Owner"),
  assigned_to_id: requiredString("Assigned To"),

  source_id: requiredString("Contact Source"),

  first_name: requiredString("First Name"),
  last_name: requiredString("Last Name"),

  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),

  account_id: requiredString("Account Name"),
  role_id: requiredString("Contact Role"),
  status_id: requiredString("Status"),

  website: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  mobile: requiredString("Mobile"),

  fax: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  address1: z.string().optional().or(z.literal("")),
  address2: z.string().optional().or(z.literal("")),
  country_id: requiredString("Country"),
  state_id: requiredString("State"),
  postal_code: z.string().optional().or(z.literal("")),
});
*/