"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import Drawer from "@/components/Drawer";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SystemUsersFormValues } from "@/partials/settings/general/systemUsers/SystemUsersFormValues";
import { SystemUsersFormSchema } from "@/partials/settings/general/systemUsers/SystemUsersFormSchema";
import { ACTIVE_OPTIONS } from "@/constants/general_constants";
import { POST } from "@/helper/ServerSideActions";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";
import { handleResponse } from "@/helper/ClientSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";

import toast from "react-hot-toast";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import useRolesStore from "@/stores/settings/useRolesStore";
import useProfilesStore from "@/stores/settings/useProfilesStore";


const TreeView = ({ data, onSelect }) => (
  <ul className="space-y-2 pl-4">
    {data.map((node) => (
      <li key={node.id}>
        <button
          type="button"
          onClick={() => onSelect(node)}
          className="text-left text-sm hover:underline"
        >
          {node.title}
        </button>
        {node.children?.length > 0 && (
          <div className="ml-4 border-l border-gray-300 pl-2">
            <TreeView data={node.children} onSelect={onSelect} />
          </div>
        )}
      </li>
    ))}
  </ul>
);

export function SystemUsersForm({ title }) {
  const {
    saveSystemUser,
    updateSystemUser,
    selectedSystemUser,
    clearSelectedSystemUser,
  } = useSystemUsersStore();

  const { fetchRoles, rolesHierarchy = [] } = useRolesStore();
  const { profiles, fetchProfiles } = useProfilesStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Fetch roles and profiles on mount
  useEffect(() => {
    fetchRoles();
    fetchProfiles();
  }, [fetchRoles, fetchProfiles]);

  const defaultValues = useMemo(
    () => SystemUsersFormValues(selectedSystemUser),
    [selectedSystemUser]
  );

  const methods = useForm({
    resolver: zodResolver(SystemUsersFormSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
    if (selectedSystemUser) {
      setSelectedRole(defaultValues.role); // Preselect role for editing
      setIsOpen(true);
    }
  }, [defaultValues, selectedSystemUser, reset]);

  const handleTreeSelect = (node) => {
    const selected = { label: node.title, value: String(node.id) };
    setSelectedRole(selected);
    //setValue("role", selected);
    setValue("role", selected, { shouldValidate: true });
    setShowTreeModal(false);
  };

  const handleAddNew = () => {
    reset(SystemUsersFormValues(null));
    setSelectedRole(null);
    setIsOpen(true);
  };

  const handleDrawerClose = () => {
    setIsOpen(false);
    clearSelectedSystemUser();
    reset(SystemUsersFormValues(null));
    setSelectedRole(null);
  };

  const onSubmit = async (formData) => {
    try {
      // Destructure confirm_password to exclude it
      const { confirm_password, ...dataWithoutConfirm } = formData;

      const payload = {
        ...dataWithoutConfirm,

        profile_id: Number(formData?.profile?.value),
        profile: JSON.stringify(formData?.profile),

        role_id: Number(formData?.role?.value),
        role: JSON.stringify(formData?.role),

        active: parseInt(formData.active?.value),
      };

      const response = await POST(
        crm_endpoints?.settings?.["system-users"]?.save,
        payload
      );

      if (response?.status === 200) {
        formData.id
          ? updateSystemUser(response.data)
          : saveSystemUser(response.data);
        handleDrawerClose();
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      {/* Add New Trigger */}
      <Button variant="outline" onClick={handleAddNew}>
        Add New
      </Button>

      {/* Form Drawer */}
      <Drawer title={title} isOpen={isOpen} onClose={handleDrawerClose}>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <InputControl name="name" title="First Name" />
          <InputControl name="last_name" title="Last Name" />
          <InputControl name="email" title="Email" type="email" />
          <InputControl name="password" title="Password" type="password" />
          <InputControl
            name="confirm_password"
            title="Confirm Password"
            type="password"
          />

          {/* Role Tree Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role</label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTreeModal(true)}
              className="w-full justify-start"
            >
              {selectedRole?.label || "Select Role"}
            </Button>
          </div>

          <SelectControl
            name="profile"
            title="Profile"
            options={getDropdownFormattedData(profiles ?? [])}
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

      {/* Tree Modal */}
      <Dialog open={showTreeModal} onOpenChange={setShowTreeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Role</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <TreeView data={rolesHierarchy} onSelect={handleTreeSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
