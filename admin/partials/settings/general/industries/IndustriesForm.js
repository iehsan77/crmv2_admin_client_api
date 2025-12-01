"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { IndustriesFormValues } from "@/partials/settings/general/industries/IndustriesFormValues";
import { IndustriesFormSchema } from "@/partials/settings/general/industries/IndustriesFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useIndustriesStore from "@/stores/settings/useIndustriesStore";

import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";

export function IndustriesForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    saveIndustry,
    updateIndustry,
    selectedIndustry,
    clearSelectedIndustry,
  } = useIndustriesStore();

  // FORM
  const defaultValues = useMemo(
    () => IndustriesFormValues(selectedIndustry),
    [selectedIndustry]
  );

  const methods = useForm({
    resolver: zodResolver(IndustriesFormSchema),
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
      const response = await POST(crm_endpoints?.settings?.industries?.save, body);

      if (response?.status === 200) {
        if (formData.id) updateIndustry(response?.data);
        else saveIndustry(response?.data);
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
    if (selectedIndustry) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedIndustry, methods, defaultValues]);

  return (
    <>
      {/* ✅ Custom trigger */}
      <Button
        variant="outline"
        onClick={() => {
          methods.reset(IndustriesFormValues(null)); // Clear the form
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
          clearSelectedIndustry();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="title" title="Title" />
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
