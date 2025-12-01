"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";


import { DepartmentsFormValues } from "@/partials/settings/general/departments/DepartmentsFormValues";
import { DepartmentsFormSchema } from "@/partials/settings/general/departments/DepartmentsFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useDepartmentsStore from "@/stores/settings/useDepartmentsStore";

import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";

export function DepartmentsForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    saveDepartment,
    updateDepartment,
    selectedDepartment,
    clearSelectedDepartment,
  } = useDepartmentsStore();

  // FORM
  const defaultValues = useMemo(
    () => DepartmentsFormValues(selectedDepartment),
    [selectedDepartment]
  );

  const methods = useForm({
    resolver: zodResolver(DepartmentsFormSchema),
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
      const response = await POST(crm_endpoints?.settings?.departments?.save, body);

      if (response?.status === 200) {
        if (formData.id) updateDepartment(response?.data);
        else saveDepartment(response?.data);
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
    if (selectedDepartment) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedDepartment, methods, defaultValues]);

  return (
    <>
      {/* ✅ Custom trigger */}
      <Button
        variant="outline"
        onClick={() => {
          methods.reset(DepartmentsFormValues(null)); // Clear the form
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
          clearSelectedDepartment();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="title" title="Title" />
          <InputControl name="code" title="Code" info="e.g. HR for Human Resources"  />
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
