"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";


import { StagesFormValues } from "@/partials/settings/customizations/deals/StagesFormValues";
import { StagesFormSchema } from "@/partials/settings/customizations/deals/StagesFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useStagesStore from "@/stores/settings/useStagesStore";

import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";

export function StagesForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    saveStage,
    updateStage,
    selectedStage,
    clearSelectedStage,
  } = useStagesStore();

  // FORM
  const defaultValues = useMemo(
    () => StagesFormValues(selectedStage),
    [selectedStage]
  );

  const methods = useForm({
    resolver: zodResolver(StagesFormSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        slug: slugify(formData?.title),
        active: parseInt(formData?.active?.value),
      };
      const response = await POST(crm_endpoints?.crm?.deals?.stages?.save, body);

      if (response?.status === 200) {
        if (formData.id) updateStage(response?.data);
        else saveStage(response?.data);
        reset();
        setIsOpen(false);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // CONVERT TO SLUG
  const toSlug = watch("title");
  useEffect(() => {
    if (toSlug) {
      setValue("slug", slugify(toSlug), { shouldValidate: true });
    }
  }, [toSlug, setValue]);

  useEffect(() => {
    if (selectedStage) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedStage, methods, defaultValues]);

  return (
    <>
      {/* ✅ Custom trigger */}
      <Button
        variant="outline"
        onClick={() => {
          methods.reset(StagesFormValues(null)); // Clear the form
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
          clearSelectedStage();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="title" title="Title" />
          <InputControl name="color" type="color" title="Color" />
          <InputControl name="percentage" title="Percentage/ Stage Value" info="e.g. HR for Human Resources"  />
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
