"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import { Button } from "@/components/ui/button";

import {handleResponse} from "@/helper/ClientSideActions";
import { POST } from "@/helper/ServerSideActions";

import { formSchema } from "./formSchema";
import { getFormValues } from "./formValues";
import Drawer from "@/components/Drawer";
import { slugify } from "@/helper/EcomActions";

const AddEdit = ({ isOpen, onClose, onSave, record }) => {

  // PAGE RELATED - starting
  const addTitle = "Add Tag";
  const editTitle = "Edit Tag";
  const addRecordUrl = ecom_endpoints.products.tags.create;
  // PAGE RELATED - ending

  // FORM METHODS - starting
  const defaultValues = useMemo(() => getFormValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const {
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  // FORM METHODS - ending

  // FORM SUBMISSIONS - starting
  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        active: formData?.active.value,
      };
      const response = await POST(addRecordUrl, body);
      if (response?.status === 200 || response?.status === 201) {
        onSave(response.data);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };
  // FORM SUBMISSIONS - ending

  // CONVERT TO SLUG - starting
  const title = watch("title");
  useEffect(() => {
    if (title) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, setValue]);
  // CONVERT TO SLUG - ending

  return (
    !loading && (
      <>
        <Drawer
          isOpen={isOpen}
          onClose={onClose}
          title={record ? editTitle : addTitle}>
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-1">
              <InputControl name="title" type="text" placeholder="title" />
            </div>

            <div className="grid lg:grid-cols-1">
              <InputControl name="slug" type="text" placeholder="slug" />
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
              <Button variant="outline" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
            </div>
          </FormProvider>
        </Drawer>
      </>
    )
  );
};

export default AddEdit;
