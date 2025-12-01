"use client";

import { POST_WITH_FORMDATA } from "@/helper/ServerSideActions";
import { Button } from "@/components/ui/button";
import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import FileUpload from "@/components/FormControls/FileUpload";
import { Logout } from "@/helper/ServerSideActions";
import useVendorStore from "@/stores/ecommerce/useVendorStore";
import { ecom_endpoints } from "@/utils/ecom_endpoints";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {ALLWOED_IMAGE_TYPES} from "@/constants/general_constants";

export default function MultiImageBannerForm({ currentData }) {
  const router = useRouter();
  const { vendor, setVendor } = useVendorStore();

  const myFormSchema = z.object({
    carousel_id: z.number(),
    id: z.number().default(0),
    image_title: z.string().min(1, "Title is required"),
    target_url: z
      .string()
      .min(1, { message: "Please enter url" })
      .url({ message: "Invalid Url" }),
    position: z.string(),
    image: z
      .union([z.string(), z.instanceof(File)])
      .refine(
        (value) =>
          currentData
            ? value instanceof File || typeof value === "string"
            : value instanceof File || value,
        {
          message: "Thumbnail file is required",
        }
      ),
    old_image: z.string(),
  });

  const defaultValues = useMemo(
    () => ({
      carousel_id: currentData?.carousel_id || 0,
      id: currentData?.id || 0,
      image_title: currentData?.image_title || "",
      target_url: currentData?.target_url || "",
      position: currentData?.position || "",
      image: "",
      old_image: currentData?.image || "",
    }),
    [currentData]
  );

  const methods = useForm({
    resolver: zodResolver(myFormSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (data) => {
    let body = new FormData();
    for (const key in data) {
      body.append(key, data[key]);
    }
    try {
      const res = await POST_WITH_FORMDATA(
        ecom_endpoints.BANNER.ADD_MULTI_BANNER,
        body
      );
      if (res?.detail !== undefined) {
        toast.error(res.detail);
        setVendor({});
        Logout();
      }
      if (res?.status === 200 || res?.status === 201) {
        router.push("/banner");
        toast.success(res?.message);
      } else {
        toast.error(res?.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="shadow-lg p-4 rounded-md bg-white">
      <h4 className="display4 text-gray mb-4">Banner Details</h4>
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <InputControl
            title="Banner Title"
            name="image_title"
            placeholder="Banner Title"
          />
          <InputControl
            title="Target URL"
            name="target_url"
            placeholder="Target Url"
          />
          <InputControl
            title="Position"
            name="position"
            placeholder="Position"
            readOnly
          />
        </div>
        <div>
          <FileUpload
            name="image"
            title="Banner Image"
            placeholder="Banner Image"
            validation={{
              maxWidth: 764,
              maxHeight: 440,
              aspectRatio: 764 / 440,
              maxFiles: 5,
            }}
            accept={ALLWOED_IMAGE_TYPES}
            isHide={true}
          />
        </div>
        <div className="text-right">
          <Button
            variant="outline"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {currentData ? "Update" : "Submit"}
          </Button>
        </div>
      </FormProvider>
    </div>
  );
}
