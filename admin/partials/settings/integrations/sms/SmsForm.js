"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { SmsFormValues } from "@/partials/settings/integrations/sms/SmsFormValues";
import { SmsFormSchema } from "@/partials/settings/integrations/sms/SmsFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useSmsStore from "@/stores/settings/useSmsStore";

import { Button } from "@/components/ui/button";

import { handleResponse } from "@/helper/ClientSideActions";

export function SmsForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    saveSms,
    updateSms,
    selectedSms,
    clearSelectedSms,
  } = useSmsStore();

  // FORM
  const defaultValues = useMemo(
    () => SmsFormValues(selectedSms),
    [selectedSms]
  );

  const methods = useForm({
    resolver: zodResolver(SmsFormSchema),
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
        default: parseInt(formData?.default?.value),
        active: parseInt(formData?.active?.value),
      };
      const response = await POST(crm_endpoints?.settings?.integrations?.sms?.save, body);
      if (response?.status === 200) {
        if (formData.id) updateSms(response?.data);
        else saveSms(response?.data);
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
    if (selectedSms) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedSms, methods, defaultValues]);

  return (
    <>
      {/* ✅ Custom trigger */}
      <Button
        variant="outline"
        onClick={() => {
          methods.reset(SmsFormValues(null)); // Clear the form
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
          clearSelectedSms();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="provider_name" title="Provider Name" />
          <InputControl name="api_url" title="API URL" />
          <InputControl name="api_key" title="API Key" />
          <InputControl name="sender_id" title="Sender ID" />
          <InputControl name="sender_phone" title="Sender Phone" />
          <SelectControl
            name="default"
            title="Default"
            placeholder="is default"
            options={ACTIVE_OPTIONS}
          />
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
