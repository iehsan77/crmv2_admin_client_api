"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import IconsLink from "@/components/IconsLink";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { DesignationsFormValues } from "@/partials/settings/general/designations/DesignationsFormValues";
import { DesignationsFormSchema } from "@/partials/settings/general/designations/DesignationsFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useDesignationsStore from "@/stores/settings/useDesignationsStore";

import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";

export function DesignationsForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  const { saveDesignation, updateDesignation, selectedDesignation, clearSelectedDesignation } =
  useDesignationsStore();

  // FORM
  const defaultValues = useMemo(
    () => DesignationsFormValues(selectedDesignation),
    [selectedDesignation]
  );

  const methods = useForm({
    resolver: zodResolver(DesignationsFormSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        slug: slugify(formData?.title),
        active: parseInt(formData?.active?.value),
      };
      const response = await POST(crm_endpoints?.settings?.designations?.save, body);

      if (response?.status === 200) {
        if (formData.id) updateDesignation(response?.data);
        else saveDesignation(response?.data);
        reset();
        setIsOpen(false);
      } else {
        handleResponse(response);
        //toast.error(response.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // CONVERT TO SLUG - starting
  const toSlug = watch("title");
  useEffect(() => {
    if (toSlug) {
      setValue("slug", slugify(toSlug), { shouldValidate: true });
    }
  }, [toSlug, setValue]);
  // CONVERT TO SLUG - ending

  useEffect(() => {
    if (selectedDesignation) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedDesignation, methods, defaultValues]);

  return (
    <>
      {/* ✅ Custom trigger */}
      <Button
        variant="outline"
        onClick={() => {
          methods.reset(DesignationsFormValues(null)); // Clear the form
          setIsOpen(true);
        }}
      >
        Add New
      </Button>
      <Drawer
        title={title}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          clearSelectedDesignation();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="title" title="Title" />
          <InputControl name="code" title="Code" info="e.g. CEO for Chief Executive Officer"  />
          <InputControl name="excerpt" title="Description" />
          <InputControl name="sort_by" type="number" title="Sort By" />
          <SelectControl
            name="active"
            title="Active"
            placeholder="Active"
            options={ACTIVE_OPTIONS}
          />
          <SubmitBtn isSubmitting={isSubmitting} />
        </FormProvider>
      </Drawer>
    </>
  );
}
