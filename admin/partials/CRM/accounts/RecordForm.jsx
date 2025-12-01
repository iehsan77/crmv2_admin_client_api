"use client";

import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import NumberInput from "@/components/FormFields/NumberInput";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import useAccountsStore from "@/stores/crm/useAccountsStore";
//import useIndustriesStore from "@/stores/settings/useIndustriesStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";

import { useDrawer } from "@/context/drawer-context";

import {
  ACCOUNTS_STATUS_OPTIONS,
  COMPANY_TYPES,
} from "@/constants/crm_constants";
import { INDUSTRIES } from "@/constants/general_constants";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

export default function RecordForm({ record = {} }) {
  const { hideDrawer } = useDrawer();
  const [owners, setOwners] = useState([]);

  const accounts = useAccountsStore((s) => s.records);
  const fetchAccounts = useAccountsStore((s) => s.fetchRecords);
  const saveRecord = useAccountsStore((state) => state.saveRecord);
  const updateRecord = useAccountsStore((state) => state.updateRecord);

  //const industries = useIndustriesStore((s) => s.industries);
  //const fetchIndustries = useIndustriesStore((s) => s.fetchIndustries);

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

  // FETCH DATA - starting
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
  /*
  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);
  */
  // FETCH DATA - ending

  // Submit
  const onSubmit = async (formData) => {
    try {
      const body = { ...formData, deletable: 0 };

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
          Account Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <TextInput
            label="Account Title/Name"
            type="text"
            value={watch("title")}
            error={errors.title?.message}
            {...register("title")}
            maxLength={100}
          />

          {/* Owner */}
          <SingleSelectInput
            label="Account Owner"
            options={users}
            value={watch("owner_id")}
            onChange={(option) => handleChange("owner_id", option)}
            error={errors.owner_id?.message}
            clearError={() => clearErrors("owner_id")}
          />

          {/* Parent Account */}
          <SingleSelectInput
            label="Parent Account"
            options={getDropdownFormattedData(accounts, record?.id || 0)}
            value={watch("parent_id")}
            onChange={(option) => handleChange("parent_id", option)}
            error={errors.parent_id?.message}
            clearError={() => clearErrors("parent_id")}
          />

          {/* Location / Site */}
          <TextInput
            label="Account Location/Site"
            type="text"
            value={watch("location")}
            error={errors.location?.message}
            {...register("location")}
            maxLength={100}
          />

          {/* Account Number */}
          <TextInput
            label="Account Number"
            type="text"
            value={watch("account_number")}
            error={errors.account_number?.message}
            {...register("account_number")}
          />

          {/* Account Type */}
          <SingleSelectInput
            label="Account Type"
            options={COMPANY_TYPES}
            value={watch("type_id")}
            onChange={(option) => handleChange("type_id", option)}
            error={errors.type_id?.message}
            clearError={() => clearErrors("type_id")}
          />

          <SingleSelectInput
            label="Status"
            options={ACCOUNTS_STATUS_OPTIONS}
            value={watch("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />

          {/* Industry */}
          <SingleSelectInput
            label="Industry"
            options={INDUSTRIES}
            value={watch("industry_id")}
            onChange={(option) => handleChange("industry_id", option)}
            error={errors.industry_id?.message}
            clearError={() => clearErrors("industry_id")}
          />

          {/* Financial Info */}
          <NumberInput
            label="Annual Revenue"
            value={watch("annual_revenue")}
            error={errors.annual_revenue?.message}
            {...register("annual_revenue")}
          />
          <NumberInput
            label="Employees"
            value={watch("employees")}
            error={errors.employees?.message}
            {...register("employees")}
          />

          {/* Contact Info */}
          <TextInput
            label="Phone"
            type="text"
            value={watch("phone")}
            error={errors.phone?.message}
            {...register("phone")}
            maxLength={20}
          />
          <TextInput
            label="Mobile"
            type="text"
            value={watch("mobile")}
            error={errors.mobile?.message}
            {...register("mobile")}
            maxLength={20}
          />
          <TextInput
            label="Email"
            type="text"
            value={watch("email")}
            error={errors.email?.message}
            {...register("email")}
            maxLength={100}
          />
          <TextInput
            label="Website"
            type="text"
            value={watch("website")}
            error={errors.website?.message}
            {...register("website")}
            maxLength={150}
          />
          <TextInput
            label="Fax"
            type="text"
            value={watch("fax")}
            error={errors.fax?.message}
            {...register("fax")}
            maxLength={20}
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
export const FormValues = (record) => ({
  id: record?.id ?? 0,
  title: record?.title ?? "",
  owner_id: record?.owner_id?.toString() ?? "",
  parent_id: record?.parent_id?.toString() ?? "",
  location: record?.location ?? "",
  account_number: record?.account_number ?? "",
  type_id: record?.type_id?.toString() ?? "",
  industry_id: record?.industry_id?.toString() ?? "",
  status_id: record?.status_id?.toString() ?? "",
  annual_revenue: record?.annual_revenue ?? "",
  employees: record?.employees ?? "",
  phone: record?.phone ?? "",
  mobile: record?.mobile ?? "",
  email: record?.email ?? "",
  website: record?.website ?? "",
  fax: record?.fax ?? "",
});

/* -------------------------------
 * Validation Schema
 * ----------------------------- */
const requiredString = (field) =>
  z.string().min(1, { message: `${field} is required` });

export const FormSchema = z.object({
  id: z.number().default(0),
  title: requiredString("Account Title"),
  owner_id: requiredString("Account Owner"),
  parent_id: z.string().optional().nullable(),
  location: z.string().optional(),
  account_number: z.string().optional(),
  type_id: requiredString("Account Type"),
  industry_id: requiredString("Industry"),
  status_id: requiredString("Status"),

  annual_revenue: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) => !val || !isNaN(Number(val)),
      "Annual Revenue must be numeric"
    ),

  employees: z
    .union([z.string(), z.number()])
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), "Employees must be numeric"),

  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url({ message: "Invalid website URL" })
    .optional()
    .or(z.literal("")),
  fax: z.string().optional(),
});
