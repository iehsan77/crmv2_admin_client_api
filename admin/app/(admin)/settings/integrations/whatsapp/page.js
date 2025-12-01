"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import toast from "react-hot-toast";

import { ACTIVE_OPTIONS } from "@/constants/general_constants";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

import { PageSubTitle } from "@/components/PageTitle";

import { WhatsappFormSchema } from "@/partials/settings/integrations/whatsapp/WhatsappFormSchema";
import { WhatsappFormValues } from "@/partials/settings/integrations/whatsapp/WhatsappFormValues";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

export default function CompanyDetails() {
  const methods = useForm({
    resolver: zodResolver(WhatsappFormSchema),
    defaultValues: WhatsappFormValues(null),
  });

  const title = "Whatsapp Integrations";

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        sandbox_mode: parseInt(formData?.sandbox_mode?.value),
        active: 1,
        sort_by: 1,
      };

      const response = await POST(
        crm_endpoints?.settings?.integrations?.whatsapp?.save,
        body
      );

      if (response?.status === 200) {
        toast.success(response?.message);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await POST(
          crm_endpoints?.settings?.integrations?.whatsapp?.get
        );


        if (response?.status === 200) {
          reset(WhatsappFormValues(response?.data[0]));
        } else {
          handleResponse(response);
        }
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "An error occurred while fetching data.");
      }
    };

    fetchCompanyData();
  }, [reset]);


  return (
    <>
      <PageSubTitle title={title}></PageSubTitle>
      <div className="page">
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <div className="gap-6">
            <h2>Provider Settings</h2>
            <InputControl
              name="provider_name"
              title="Provider Name"
              vertical={false}
              className="mb-4"
            />
            <div className="mb-4 flex flex-col">
              <div className="grid md:grid-cols-4 gap-2 md:gap-4 items-center justify-center">
                <div className="col-span-1 md:text-right false">
                  <label className="text-sm text-gray-600 mb-1">
                    Use Sandbox Mode
                  </label>
                </div>
                <div className="relative w-full col-span-3">
                  <SelectControl
                    name="sandbox_mode"
                    placeholder=""
                    options={ACTIVE_OPTIONS}
                    vertical={false}
                    className="mb-4"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2>Authentication</h2>
            <InputControl
              name="api_key"
              title="API Key"
              vertical={false}
              className="mb-4"
            />
            <InputControl
              name="phone_number_id"
              title="Phone Number ID"
              vertical={false}
              className="mb-4"
            />
            <InputControl
              name="business_phone_number"
              title="WhatsApp Business Phone Number"
              vertical={false}
              className="mb-4"
            />
          </div>

          <div>
            <h2>Webhook Configuration</h2>
            <InputControl
              name="webhook_url"
              title="Webhook URL"
              vertical={false}
              className="mb-4"
            />
            <InputControl
              name="webhook_verify_token"
              title="Webhook Verify Token"
              vertical={false}
              className="mb-4"
            />
            <InputControl
              name="webhook_events"
              title="Webhook Events"
              vertical={false}
              className="mb-4"
            />
          </div>

          <div>
            <h2>Admin/Owner Info (Optional)</h2>
            <InputControl
              name="business_display_name"
              title="Business Display Name"
              vertical={false}
              className="mb-4"
            />
            <InputControl
              name="business_website"
              title="Business Website"
              vertical={false}
              className="mb-4"
            />
          </div>

          <div className="flex flex-col">
            <div className="grid md:grid-cols-12 gap-1 md:gap-4 items-center justify-center">
              <div className="w-full col-span-10" />
              <div className="col-span-2 md:text-right">
                <SubmitBtn isSubmitting={isSubmitting} />
              </div>
            </div>
          </div>
        </FormProvider>
      </div>
    </>
  );
}
