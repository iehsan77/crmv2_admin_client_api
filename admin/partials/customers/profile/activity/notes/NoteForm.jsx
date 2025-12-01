"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider as Form } from "react-hook-form";
import { z } from "zod";

import { useParams } from "next/navigation";

import toast from "react-hot-toast";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import { useNotesStore } from "@/stores/customers/useCustomersStore";
import MultilineInput from "@/components/FormFields/MultilineInput";

import { rentify_endpoints } from "@/utils/rentify_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

export default function NoteForm({ record = {} }) {
  const { id: customer_id } = useParams();
  const { hideDrawer } = useDrawer();
  const { saveNote, updateNote } = useNotesStore();

  // ✅ Validation schema
  const formSchema = z.object({
    id: z.number().default(0),
    content: z.string().min(1, { message: "required" }),
  });

  // ✅ Default values
  const defaultValues = {
    id: record?.id || 0,
    content: record?.content || "",
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
    formState: { isSubmitting, errors },
  } = methods;

  // ✅ Submit handler
  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        customer_id: Number(customer_id),
      };

      const response = await POST(
        rentify_endpoints?.rentify?.customers?.saveNote,
        body
      );

      hideDrawer();
      if (response?.status === 200) {
        if (record?.id) {
          updateNote(response?.data);
        } else {
          saveNote(response?.data);
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="pt-8 space-y-8">
          <MultilineInput
            label="Note"
            value={watch("content")}
            maxLength={300}
            error={errors.content?.message}
            {...register("content")}
          />

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
        </div>
      </form>
    </Form>
  );
}
