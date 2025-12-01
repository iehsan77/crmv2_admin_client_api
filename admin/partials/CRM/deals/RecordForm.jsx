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

import useDealsStore from "@/stores/crm/useDealsStore";
import useAccountsStore from "@/stores/crm/useAccountsStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import useContactsStore from "@/stores/crm/useContactsStore";
import useLeadsStore from "@/stores/crm/useLeadsStore";

import { useDrawer } from "@/context/drawer-context";

import {
  DEALS_STATUS_OPTIONS,
  COMPANY_TYPES,
  DEALS_TYPES_OPTIONS,
  LEADS_SOURCES_OPTIONS,
  DEALS_SOURCE_OPTIONS,
} from "@/constants/crm_constants";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

export default function RecordForm({ record = {} }) {
  const { hideDrawer } = useDrawer();
  const [owners, setOwners] = useState([]);

  const accounts = useAccountsStore((state) => state.records);
  const fetchAccounts = useAccountsStore((state) => state.fetchRecords);

  const leads = useLeadsStore((state) => state.records);
  const fetchLeads = useLeadsStore((state) => state.fetchRecords);
  const setFetchAllLeads = useLeadsStore((state) => state.setFetchAll);

  const contacts = useContactsStore((state) => state.records);
  const fetchContacts = useContactsStore((state) => state.fetchRecords);
  const setFetchAllContacts = useContactsStore((state) => state.setFetchAll);

  const saveRecord = useDealsStore((state) => state.saveRecord);
  const updateRecord = useDealsStore((state) => state.updateRecord);

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
    setFetchAllLeads(true);
    fetchAccounts();
    fetchSystemUsers();
    fetchLeads();
    fetchContacts();
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

  const contactOptions = useMemo(() => {
    if (!Array.isArray(contacts) || contacts.length === 0) return [];

    return contacts.map((c) => {
      const fullName = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
      const email = c.email ? ` — ${c.email}` : "";
      return {
        value: String(c.id),
        label: String(`${fullName}${email}`),
      };
    });
  }, [contacts]);

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
          Deal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SingleSelectInput
            label="Deal Owner"
            options={users}
            value={watch("owner_id")}
            onChange={(option) => handleChange("owner_id", option)}
            error={errors.owner_id?.message}
            clearError={() => clearErrors("owner_id")}
          />
          <TextInput
            label="Deal Title/Name"
            type="text"
            value={watch("title")}
            error={errors.title?.message}
            {...register("title")}
          />
          <SingleSelectInput
            label="Account Name"
            options={getDropdownFormattedData(accounts)}
            value={watch("account_id")}
            onChange={(option) => handleChange("account_id", option)}
            error={errors.account_id?.message}
            clearError={() => clearErrors("account_id")}
          />
          <SingleSelectInput
            label="Deal Type"
            options={DEALS_TYPES_OPTIONS}
            value={watch("type_id")}
            onChange={(option) => handleChange("type_id", option)}
            error={errors.type_id?.message}
            clearError={() => clearErrors("type_id")}
          />
          <SingleSelectInput
            label="Source"
            options={DEALS_SOURCE_OPTIONS}
            value={watch("source_id")}
            onChange={(option) => handleChange("source_id", option)}
            error={errors.source_id?.message}
            clearError={() => clearErrors("source_id")}
          />
          <SingleSelectInput
            label="Contact Name"
            options={contactOptions}
            value={watch("contact_id")}
            onChange={(option) => handleChange("contact_id", option)}
            error={errors.contact_id?.message}
            clearError={() => clearErrors("contact_id")}
          />
          <TextInput
            label="Amount"
            type="text"
            value={watch("amount")}
            error={errors.amount?.message}
            {...register("amount")}
          />
          <DatePickerInput
            label="Closing Date"
            value={watch("closing_date")}
            onChange={(option) => handleChange("closing_date", option)}
            error={errors.closing_date?.message}
            clearError={() => clearErrors("closing_date")}
            minDateTime={new Date().toISOString()}
          />
          <SingleSelectInput
            label="Stage"
            options={DEALS_STATUS_OPTIONS}
            value={watch("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />
          <NumberInput
            label="Probability (%)"
            type="text"
            value={watch("probability")}
            error={errors.probability?.message}
            {...register("probability")}
          />
          <NumberInput
            label="Expected Revenue"
            type="text"
            value={watch("expected_revenue")}
            error={errors.expected_revenue?.message}
            {...register("expected_revenue")}
          />
          {/* <SingleSelectInput
          label="Campaign Source"
          options={[{label:"Campaign 1", value:"1"}]}
          value={watch("campaign_source_id")}
          onChange={(option) => handleChange("campaign_source_id", option)}
          error={errors.campaign_source_id?.message}
          clearError={() => clearErrors("campaign_source_id")}
        /> */}
        </div>
        <div>
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
export const FormValues = (record = {}) => ({
  id: record?.id ?? 0,
  owner_id: record?.owner_id?.toString() ?? "",
  title: record?.title ?? "",
  account_id: record?.account_id?.toString() ?? "",
  type_id: record?.type_id?.toString() ?? "",
  source_id: record?.source_id?.toString() ?? "",
  contact_id: record?.contact_id?.toString() ?? "",
  amount: record?.amount?.toString() ?? "",
  closing_date: record?.closing_date ?? "",
  status_id: record?.status_id?.toString() ?? "",
  probability: record?.probability?.toString() ?? "",
  expected_revenue: record?.expected_revenue?.toString() ?? "",
  description: record?.description ?? "",
});

/* -------------------------------
 * Validation Schema
 * ----------------------------- */
const requiredString = (field) =>
  z
    .string({ required_error: `${field} is required` })
    .min(1, { message: `${field} is required` });

export const FormSchema = z.object({
  id: z.number().default(0),

  owner_id: requiredString("Deal Owner"),
  title: requiredString("Deal Title/Name"),
  type_id: requiredString("Deal Type"),
  account_id: requiredString("Account"),
  contact_id: requiredString("Contact Name"),
  source_id: requiredString("Deal source"),
  amount: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)), "Amount must be numeric")
    .optional(),
  closing_date: requiredString("Closing Date"),
  status_id: requiredString("Stage"),
  /*
  probability: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)), "Probability must be numeric")
    .optional(),
    */
  probability: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)), {
      message: "Probability must be numeric",
    })
    .refine(
      (val) => {
        const num = Number(val);
        return num >= 0 && num <= 100;
      },
      {
        message: "Probability must be between 0 and 100",
      }
    )
    .optional(),
  expected_revenue: z
    .union([z.string(), z.number()])
    .refine((val) => !isNaN(Number(val)), "Expected Revenue must be numeric")
    .optional(),
  description: z.string().optional(),
});
