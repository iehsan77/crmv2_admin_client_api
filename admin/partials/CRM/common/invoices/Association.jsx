"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import Button from "@/components/Button";
import MultiSelectInput from "@/components/FormControls/MultiSelectInput";

import useContactsStore, {useContactsAssociationStore} from "@/stores/crm/useContactsStore";

import { useDrawer } from "@/context/drawer-context";
import {
  getDropdownFormattedData,
  useSegment,
} from "@/helper/GeneralFunctions";

/* -------------------------------
 * Validation Schema
 * ----------------------------- */
const FormSchema = z.object({
  id: z.number().default(0),
  target_module_ids: z
    .array(
      z.union([
        z.string(),
        z.number(),
        z.object({
          label: z.string(),
          value: z.string().or(z.number()),
        }),
      ])
    )
    .nonempty("Please select at least one contact"),
});

/* -------------------------------
 * Default Values Helper
 * ----------------------------- */
const getDefaultValues = (record = {}) => ({
  id: record?.id ?? 0,
  target_module_ids: record?.target_module_ids?.map((t)=>String(t)) ?? [],
});

/* -------------------------------
 * Component
 * ----------------------------- */
export default function Association({ record = {} }) {
  const { hideDrawer } = useDrawer();

  const source_module = useSegment(1);
  const source_module_id = useSegment(3);

  const saveRecord = useContactsAssociationStore((s) => s.saveRecord);

  const contacts = useContactsStore((s) => s.records);
  const fetchContacts = useContactsStore((s) => s.fetchRecords);
  const contactsLoading = useContactsStore((s) => s.recordsLoading);

  // ✅ Initialize Form
  const methods = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: getDefaultValues(record),
  });

  const {
    watch,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const handleChange = (name, value) => {
    setValue(name, value, { shouldValidate: true });
    clearErrors(name);
  };

  // ✅ Fetch contacts data
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ✅ Reset form when record changes
  useEffect(() => {
    reset(getDefaultValues(record));
  }, [record, reset]);

  // ✅ Submit handler
  const onSubmit = async (formData) => {
    try {

      const body = {
        source_module,
        source_module_id,
        target_module: "contacts",
        id:formData?.id,
        target_module_ids: JSON.stringify(formData?.target_module_ids),
      };

      await saveRecord(body);

      toast.success("Association saved successfully!");
      hideDrawer();
    } catch (error) {
      console.error("❌ Association submission error:", error);
      toast.error("Something went wrong while saving.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <h2 className="text-md font-semibold text-gray-800 mb-6">
          Contact Information
        </h2>

        <div className="grid grid-cols-1 gap-6">
          <MultiSelectInput
            label="Contacts"
            options={getDropdownFormattedData(contacts)}
            value={watch("target_module_ids")}
            onChange={(option) => handleChange("target_module_ids", option)}
            error={errors.target_module_ids?.message}
            clearError={() => clearErrors("target_module_ids")}
            loading={contactsLoading}
          />
        </div>

        {/* Footer */}
        <div className="pt-8 flex gap-4">
          <Button type="button" variant="secondary" onClick={hideDrawer}>
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
