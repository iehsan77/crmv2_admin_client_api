"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormData } from "@/app/(admin)/form-builder/context/FormDataContext"; // ✅ Added
import { saveForm, saveAndCloseForm } from "@/components/FormBuilder/helper/formBuilderActions"; // ✅ Added

import { FormBuilderTopBar } from "./components/FormBuilderTopBar";
import { FormBuilder } from "./components/FormBuilder";

const Page = () => {
  const router = useRouter();
  const { saveFormData } = useFormData(); // ✅ Added

  const [mainData, setMainData] = useState([
    {
      id: 0,
      app_id: 0,
      module_id: 0,
      layout_id: 0,
      user_id: 0,
    },
  ]);

  const [formFields, setFormFields] = useState([
    {
      id: `sec-${Date.now()}`,
      title: "Information",
      column: 2,
      fields: [],
      icon: "mdi:format-section",
      type: "section",
    },
  ]);

  const handleBack = () => {
    console.log("Back button clicked");
  };

  const handleClose = () => {
    router.push("/");
  };

  const handleSave = () => saveForm(formFields, mainData, saveFormData);

  const handleSaveAndClose = () =>
    saveAndCloseForm({ formFields, mainData, saveFormData, router });

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-50">
        <FormBuilderTopBar
          title="Form Builder"
          onBack={handleBack}
          onClose={handleClose}
          onSave={handleSave}
          onSaveAndClose={handleSaveAndClose}
          setValues={setMainData}
          setFormFields={setFormFields}
        />
      </div>

      <FormBuilder
        formFields={formFields}
        setFormFields={setFormFields}
        saveForm={saveForm}
      />
    </div>
  );
};

export default Page;
