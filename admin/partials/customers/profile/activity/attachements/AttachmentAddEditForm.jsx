"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TextInput from "@/components/FormFields/TextInput";
import { FormProvider as Form } from "react-hook-form";
import SingleUpload2 from "@/components/FormFields/SingleUpload2";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { useAttachmentsStore } from "@/stores/customers/useCustomersStore";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import FolderAddEditForm from "./FolderAddEditForm";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import TagInput from "@/components/FormFields/TagInput";
import { useParams } from "next/navigation";
import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import useUserStore from "@/stores/useUserStore";

import toast from "react-hot-toast";

import { ALLWOED_FILE_TYPES } from "@/constants/general_constants";

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

export default function AttachmentAddEditForm({ record }) {
  const { id: customer_id } = useParams();
  const { showDrawer, hideDrawer } = useDrawer();
  const { fetchAttachments } = useAttachmentsStore();

  const { user } = useUserStore();

  // ✅ Form Schema with validation
  const formSchema = z.object({
    id: z.number().default(0),
    file_name: z.string().min(1, { message: "required" }),
    folder: z.string().min(1, "required"),
    attached_by: z.string().min(1, { message: "required" }),
    attached_date: validateDate(),
    tags: z.array(z.string()).optional(),
    file: validateFile(),
    old_file: z.string().optional(),
    active: z.number().optional(),
  });

  // ✅ Default values
  const defaultValues = {
    id: record?.id || 0,
    file_name: record?.file_name || "",
    folder: record?.folder || "",
    attached_by: record?.attached_by || "admin",
    attached_date: record?.attached_date || new Date(),
    tags: record?.tags || [],
    file: "",
    old_file: record?.file || "",
    active: record?.active || 1,
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
        customer_id: Number(customer_id),
      };
      const response = await POST(
        rentify_endpoints?.rentify?.customers?.saveAttachements,
        body
      );

      hideDrawer();
      if (response?.status === 200) {
        fetchAttachments(customer_id);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Something went wrong");
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="col-span-3">
            <div className="text-primary underline underline-offset-3 text-base mb-2 font-medium">
              Add Attachment
            </div>
            <SingleUpload2
              name="file"
              accept={ALLWOED_FILE_TYPES}
              value={record ? watch("old_file") : watch("file")}
              onChange={(val) => handleChange("file", val)}
              onRemove={(val) => handleChange("old_file", val)}
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
                label: String(user?.first_name + " " + user?.last_name),
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

          {/* Folder */}
          <SingleSelectInput
            label="Add To Folder"
            options={[
              { value: "business_documents", label: "Business Documents" },
              { value: "vehicle_documents", label: "Vehicle Documents" },
              { value: "booking_documents", label: "Booking Documents" },
              { value: "miscellaneous", label: "Miscellaneous" },
            ]}
            value={watch("folder")}
            onChange={(option) => handleChange("folder", option)}
            // onCreate={(title) =>
            //   showDrawer({
            //     title: "Add Folder",
            //     size: "xl",
            //     content: (
            //       <div className="py-4">
            //         <FolderAddEditForm
            //           record={{ title }}
            //           onSuccess={(e) => {
            //             setValue("folder", e);
            //           }}
            //         />
            //       </div>
            //     ),
            //   })
            // }
            error={errors.folder?.message}
          />

          {/* Tags */}
          <TagInput
            label="Tags"
            value={watch("tags")}
            onChange={(tags) => handleChange("tags", tags)}
            error={errors.tags?.message}
          />

          {/* Actions */}
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
            <Button size="lg" type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
