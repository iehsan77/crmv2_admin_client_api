"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider as Form } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";

import TextInput from "@/components/FormFields/TextInput";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import Button from "@/components/Button";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";

import { useDrawer } from "@/context/drawer-context";
import { useSegment } from "@/helper/GeneralFunctions";
import { ALLWOED_FILE_TYPES } from "@/constants/general_constants";

import useUserStore from "@/stores/useUserStore";
import useAttachmentsStore from "@/stores/crm/useAttachmentsStore";

// ✅ Helper validation for file field
const validateFile = (message = "File is required") =>
  z.any().refine((file) => {
    if (!file) return false;
    if (typeof file === "string" && file.length > 0) return true;
    if (file instanceof File) return true;
    return false;
  }, message);

// ✅ Helper validation for date
const validateDate = (message = "Date is required") =>
  z
    .union([z.date(), z.string()])
    .refine((value) => {
      if (value instanceof Date) return true;
      if (typeof value === "string" && !isNaN(new Date(value).getTime()))
        return true;
      return false;
    }, message)
    .transform((value) =>
      typeof value === "string" ? new Date(value) : value
    );

// ✅ Schema
const formSchema = z.object({
  id: z.number().default(0),
  related_to: z.string().min(1),
  related_to_id: z.number().min(1),

  file_name: z.string().min(1, { message: "File name is required" }),

  attached_by: z.union([z.string(), z.object({ value: z.string() })]),

  attached_date: validateDate(),
  file: validateFile(),
  old_file: z.string().optional(),
  active: z.number().optional(),
});

export default function AttachmentForm() {
  const { id: related_to_id } = useParams();
  const { hideDrawer } = useDrawer();
  const { saveRecord, selectedRecord: record } = useAttachmentsStore();
  const { user } = useUserStore();
  const entity = useSegment(1);

  // ✅ Default values (both add/edit)
  const defaultValues = {
    id: record?.id ?? 0,
    
    related_to: record?.related_to ?? String(entity),
    related_to_id: record?.related_to_id ?? Number(related_to_id),

    file_name: record?.file_name ?? "",
    attached_by:
      record?.attached_by ?? user
        ? {
            value: String(user?.id),
            label: `${user?.first_name} ${user?.last_name}`,
          }
        : "",
    attached_date: record?.attached_date
      ? new Date(record.attached_date)
      : new Date(),
    file: "",
    old_file: record?.file ?? "",
    active: record?.active ?? 1,
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

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        related_to: String(entity),
        related_to_id: Number(related_to_id),
        attached_by:
          typeof formData.attached_by === "object"
            ? formData.attached_by.value
            : formData.attached_by,
      };

      await saveRecord(body);
      toast.success("Attachment saved successfully");
      hideDrawer();
    } catch (error) {
      console.error("❌ Submit Error:", error);
      toast.error("Something went wrong while saving");
    }
  };

  const handleChange = (name, value) => setValue(name, value);

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
        {/* Upload Section */}
        <div>
          <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
            Add Attachment
          </div>
          <SingleUpload2
            name="file"
            accept={ALLWOED_FILE_TYPES}
            value={record ? watch("old_file") : watch("file")}
            onChange={(val) => handleChange("file", val)}
            onRemove={() => handleChange("old_file", "")}
            setError={setError}
            error={errors?.file?.message}
          />
        </div>

        {/* Info Section */}
        <div className="text-primary underline underline-offset-3 text-base mb-6 font-medium">
          Attachment Information
        </div>

        {/* File Name */}
        <TextInput
          label="File Name"
          value={watch("file_name")}
          error={errors.file_name?.message}
          {...register("file_name")}
        />

        {/* Attached By */}
        <SingleSelectInput
          label="Attached By"
          options={[
            {
              value: String(user?.id),
              label: `${user?.first_name} ${user?.last_name}`,
            },
          ]}
          value={watch("attached_by")}
          onChange={(option) => handleChange("attached_by", option)}
          error={errors.attached_by?.message}
        />

        {/* Attached Date */}
        <DatePickerInput
          label="Attached Date"
          value={watch("attached_date")}
          onChange={(date) => handleChange("attached_date", date)}
          error={errors.attached_date?.message}
          clearError={() => clearErrors("attached_date")}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            type="button"
            className="bg-transparent"
            onClick={hideDrawer}
          >
            Cancel
          </Button>
          <Button size="lg" type="submit" disabled={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
