"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import TextareaControl from "@/components/FormControls/TextareaControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { RolesFormValues } from "@/partials/settings/security/roles/RolesFormValues";
import { RolesFormSchema } from "@/partials/settings/security/roles/RolesFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { slugify } from "@/helper/GeneralFunctions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import useRolesStore from "@/stores/settings/useRolesStore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { handleResponse } from "@/helper/ClientSideActions";

// Dummy treeview component
const TreeView = ({ data, onSelect }) => (
  <ul className="space-y-2 pl-4">
    {data.map((node) => (
      <li key={node.id}>
        <button
          onClick={() => onSelect(node)}
          className="text-left hover:underline"
        >
          {node.title}
        </button>
        {Array.isArray(node.children) && node.children.length > 0 && (
          <div className="ml-4 border-l border-gray-300 pl-2">
            <TreeView data={node.children} onSelect={onSelect} />
          </div>
        )}
      </li>
    ))}
  </ul>
);


export function RolesForm({ title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportTo, setReportTo] = useState([]);
  const [showTreeModal, setShowTreeModal] = useState(false);

  const {
    saveRole,
    updateRole,
    selectedRole,
    clearSelectedRole,
    rolesHierarchy = [],
  } = useRolesStore();

  const defaultValues = useMemo(() => {
    const values = RolesFormValues(selectedRole);
    return {
      ...values,
    };
  }, [selectedRole, reportTo]);

  const methods = useForm({
    resolver: zodResolver(RolesFormSchema),
    defaultValues,
  });

  const {
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
        report_to_id: parseInt(formData?.report_to?.value),
        report_to: JSON.stringify(formData?.report_to),
        active: parseInt(formData?.active?.value),
      };
      const response = await POST(crm_endpoints?.settings?.roles?.save, body);
      if (response?.status === 200) {
        if (formData.id) updateRole(response?.data);
        else saveRole(response?.data);
        reset();
        setIsOpen(false);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  /*
  useEffect(() => {
    if (selectedRole) {
      setIsOpen(true);
      methods.reset(defaultValues);
    }
  }, [selectedRole, methods, defaultValues]);
  */

  useEffect(() => {
    if (selectedRole) {
      setIsOpen(true);
      const values = RolesFormValues(selectedRole);
      methods.reset(values);
      setReportTo(values.report_to); // Syncing the state for UI display
    }
  }, [selectedRole, methods]);

  const handleTreeSelect = (node) => {
    const selected = { label: node.title, value: String(node.id) };
    setReportTo(selected);
    setValue("report_to", selected);
    setShowTreeModal(false);
  };

  return (
    <>
      {/* <Button
        variant="outline"
        onClick={() => {
          methods.reset(RolesFormValues(null));
          setReportTo({ value: "0", label: "Self 117" });
          setIsOpen(true);
        }}
      >
        Add New
      </Button> */}

      <Button
        variant="outline"
        onClick={() => {
          const defaultVals = RolesFormValues(null);
          methods.reset(defaultVals);
          setReportTo(defaultVals.report_to); // <- set the "Self" value for new form
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
          clearSelectedRole();
        }}
      >
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="title" title="Title" />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Report To</label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTreeModal(true)}
              className="w-full justify-start"
            >
              {reportTo.label}
            </Button>
          </div>
          <TextareaControl name="excerpt" title="Description" />
          <SubmitBtn isSubmitting={isSubmitting} />
        </FormProvider>
      </Drawer>

      <Dialog open={showTreeModal} onOpenChange={setShowTreeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Report To Role</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <TreeView data={rolesHierarchy} onSelect={handleTreeSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
