"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import TextareaControl from "@/components/FormControls/TextareaControl";
import FileUpload from "@/components/FormControls/FileUpload";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { CompaniesFormValues } from "@/partials/settings/general/companies/CompaniesFormValues";
import { CompaniesFormSchema } from "@/partials/settings/general/companies/CompaniesFormSchema";

import { ACTIVE_OPTIONS, COMPANY_SIZES } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { getDropdownFormattedData, slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useCompaniesStore from "@/stores/settings/useCompaniesStore";
import useIndustriesStore from "@/stores/settings/useIndustriesStore";

import { Button } from "@/components/ui/button";
import { handleResponse } from "@/helper/ClientSideActions";

export function CompaniesForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    saveCompany,
    updateCompany,
    selectedCompany,
    clearSelectedCompany,
    setViewCompany,
  } = useCompaniesStore();

  const { industries, fetchIndustries } = useIndustriesStore();

  const methods = useForm({
    resolver: zodResolver(CompaniesFormSchema),
    defaultValues: CompaniesFormValues(null), // Start with empty form
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
        slug: slugify(formData?.company_name),
        industry: formData?.industry?.value,
        company_size: formData?.company_size?.value,
        active: parseInt(formData?.active?.value || 1),
      };

      const response = await POST(
        crm_endpoints?.settings?.companies?.save,
        body
      );

      if (response?.status === 200) {
        if (formData.id) {
          updateCompany(response?.data);
        } else {
          saveCompany(response?.data);
          setViewCompany(response?.data); // ✅ Only set view for newly created company
        }

        /*
        if (formData.id) updateCompany(response?.data);
        else saveCompany(response?.data);
        */

        reset(CompaniesFormValues(null));
        setIsOpen(false);
        setViewCompany(response?.data);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong");
    }
  };

  // Sync slug with company_name
  const toSlug = watch("company_name");
  useEffect(() => {
    if (toSlug) {
      setValue("slug", slugify(toSlug), { shouldValidate: true });
    }
  }, [toSlug, setValue]);

  // Reset form when editing
  useEffect(() => {
    if (selectedCompany) {
      reset(CompaniesFormValues(selectedCompany)); // ✅ Use fresh values
      setIsOpen(true);
    }
  }, [selectedCompany, reset]);

  // Reset form when editing
  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          reset(CompaniesFormValues(null));
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
          clearSelectedCompany();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          {/* General Info */}
          <div className="text-blue-800 text-medium text-end mb-1">
            General Info
          </div>
          <InputControl name="company_name" title="Company Name" />
          <TextareaControl name="excerpt" title="Description" rows={5} />
          <SelectControl
            name="industry"
            title="Industry"
            placeholder="Select industry"
            options={getDropdownFormattedData(industries)}
            info="Select the industry your company operates in"
          />
          <SelectControl
            name="company_size"
            title="Company Size"
            placeholder="Select company size"
            options={COMPANY_SIZES}
            info="How many employees work at your company?"
          />
          <InputControl
            name="website"
            title="Website URL"
            info="e.g http://www.example.com"
          />
          <FileUpload name="logo" title="Logo" />

          {/* Address Info */}
          <div className="text-blue-800 text-medium text-end mb-1 mt-6">
            Address Info
          </div>
          <InputControl name="address" title="Company Address" />
          <InputControl name="zip_code" title="Zip Code" />
          <InputControl name="city" title="City" />
          <InputControl name="state" title="State" />
          <InputControl name="country" title="Country" />

          {/* Contact Info */}
          <div className="text-blue-800 text-medium text-end mb-1 mt-6">
            Contact Info
          </div>
          <InputControl name="email" title="Company Email" />
          <InputControl name="phone" title="Company Phone" />
          <InputControl name="fax" title="Company Fax" />
          <InputControl name="contact_person" title="Contact Person" />

          {/* Other Info */}
          <div className="text-blue-800 text-medium text-end mb-1 mt-6">
            Other Info
          </div>
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
