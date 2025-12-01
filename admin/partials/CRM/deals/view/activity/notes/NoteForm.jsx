"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider as Form } from "react-hook-form";
import { z } from "zod";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import MultilineInput from "@/components/FormFields/MultilineInput";
import { useParams } from "next/navigation";

import toast from "react-hot-toast";

import { crm_endpoints } from "@/utils/crm_endpoints";

import useDealsStore from "@/stores/crm/useDealsStore";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

export default function NoteForm() {
  const { id } = useParams();
  const { hideDrawer } = useDrawer();

  const fetchRecordDetails = useDealsStore((s) => s.fetchRecordDetails);

  const formSchema = z.object({
    id: z.number().default(0),
    note: z.string().min(1, { message: "required" }),
  });

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
    },
  });

  const {
    watch,
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        related_to: "deals",
        related_to_id: Number(id),
      };

      const response = await POST(crm_endpoints?.notes?.save, body);
      hideDrawer();
      if (response?.status === 200) {
        fetchRecordDetails(id);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Something went wrong");
    }

    //fetchRecordDetails(id);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="pt-8 space-y-8">
          <MultilineInput
            label="Note"
            type="text"
            placeholder=" "
            value={watch("note")}
            maxLength={100}
            error={errors.note?.message}
            {...register("note")}
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
            <Button size="lg" type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
