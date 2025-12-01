"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import TextEditorControl from "@/components/FormControls/TextEditorControl";
import FileUpload from "@/components/FormControls/FileUpload";

import SelectControl from "@/components/FormControls/SelectControl";
import { Button } from "@/components/ui/button";

import {handleResponse} from "@/helper/ClientSideActions";

import { POST } from "@/helper/ServerSideActions";

import {ALLWOED_IMAGE_TYPES} from "@/constants/general_constants";

const AddEdit = ({ isOpen, onClose, onSave, currentData }) => {

  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const myFormSchema = z.object({
    id: z.number().default(0),
    old_logo: z.string().optional(),
    title: z
      .string()
      .min(1, { message: "Please Enter Title" })
      .regex(/^[a-zA-Z0-9\s-]+$/, {
        message: "Only alphabets, numbers, and hyphens are allowed",
      }),
    slug: z
      .string()
      .min(1, { message: "Please Enter slug" })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "Only alphabets, numeric and '-' are allowed for this field",
      }),
    description: z.string().min(1, { message: "Please Enter Description" }),
    logo: z.union([z.instanceof(File).optional(), z.string().optional()]),
    /*
    logo: z.instanceof(File).refine((value)=> {if(!value){
      return {message: "required"}
    }}),
    */
    //  logo: z.instanceof(File).optional(),
    active: z.object({
      label: z.string().min(1, { message: "Required" }),
      value: z.string().min(1, { message: "Required" }),
    }),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentData?.id || 0, // Keep undefined instead of 0 if no ID
      title: currentData?.title || "",
      slug: currentData?.slug || "",
      description: currentData?.description || "",
      logo: "",
      old_logo: currentData?.logo || "",
      active:
        currentData?.active === 1
          ? { label: "Yes", value: "1" }
          : currentData?.active === 0
          ? { label: "No", value: "0" }
          : { label: "", value: "" }, // Ensure valid object structure
    }),
    [currentData]
  );

  const methods = useForm({
    resolver: zodResolver(myFormSchema),
    defaultValues,
  });

  const {
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (data) => {
    try {
      const body = {
        ...data,
        active: data?.active.value,
      };
      const response = await POST(body);
      if (response?.status === 200 || response?.status === 201) {
        data.logo = response.data.logo;
        onSave(data);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getDescriptionData = (data) => {
    setValue("description", data);
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/[^\w-]+/g, "") // Remove non-word characters
      .replace(/--+/g, "-"); // Replace multiple dashes with a single dash
  };
  const title = watch("title");
  useEffect(() => {
    if (title) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, setValue]);

  return (
    !loading && (
      <div
        className={`fixed inset-0 z-[998] bg-black bg-opacity-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        // onClick={onClose} // Close when clicking outside
      >
        {/* Drawer (Sliding In & Out) */}
        <div
          className={`fixed top-0 right-0 h-full w-90 max-w-md bg-white shadow-lg p-4 transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition">
            ✖
          </button>

          {/* Title */}
          <h2 className="text-lg font-semibold mb-4">
            {currentData ? "Edit Brand" : "Add Brand"}
          </h2>

          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-1">
              <InputControl name="title" type="text" placeholder="Brand Name" />
            </div>

            <div className="grid lg:grid-cols-1">
              <InputControl name="slug" type="text" placeholder="Brand slug" />
            </div>

            <div className="grid lg:grid-cols-1 mt-4">
              <TextEditorControl
                name="description"
                getData={getDescriptionData}
                control={control}
                errors={errors}
              />
            </div>

            <div className="grid lg:grid-cols-1">
              <FileUpload
                title="Logo (max 200x200 px or 1:1)"
                placeholder=".jpeg, .jpg or .png"
                name="logo"
                className="mb-4"
                validation={{
                  maxWidth: 200,
                  maxHeight: 200,
                  aspectRatio: 1 / 1,
                }}
                accept={ALLWOED_IMAGE_TYPES}
              />
            </div>

            <div className="grid lg:grid-cols-1">
              <SelectControl
                name="active"
                type="text"
                placeholder="Active"
                options={[
                  { value: "", label: "select" },
                  { value: "1", label: "Yes" },
                  { value: "0", label: "No" },
                ]}
              />
            </div>

            <div className="flex justify-center lg:justify-end mt-4">
              <Button
                variant="outline"
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}>
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
            </div>
          </FormProvider>
        </div>
      </div>
    )
  );
};

export default AddEdit;
