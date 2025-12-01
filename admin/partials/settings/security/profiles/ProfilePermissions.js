"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";

import usePermissionsStore from "@/stores/settings/usePermissionsStore";
import Loader from "@/components/Loader";
import CheckboxOrRadio from "@/components/FormControls/CheckboxOrRadio";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

import { handleResponse } from "@/helper/ClientSideActions";
import { POST } from "@/helper/ServerSideActions";

import { crm_endpoints } from "@/utils/crm_endpoints";
import toast from "react-hot-toast";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Helper to build default values
const ProfilesFormValues = (permissions, xPermissions) => {
  const defaultValues = {};
  permissions?.forEach((category) =>
    category.groups?.forEach((group) =>
      group.permissions?.forEach((perm) => {
        defaultValues[`permissions.${perm.id}`] =
          xPermissions?.includes(perm.id) || false;
      })
    )
  );
  return defaultValues;
};

export default function ProfilePermissions({ record }) {

  const { permissions, fetchPermissions, permissionsHasFetched } =
    usePermissionsStore();

  const [xPermissions, setXPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (record?.permissions?.length > 0) {
      setXPermissions(record?.permissions);
    }
  }, [record]);

  useEffect(() => {
    if (!permissionsHasFetched) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [fetchPermissions, permissionsHasFetched]);

  const defaultValues = useMemo(
    () => ProfilesFormValues(permissions, xPermissions),
    [permissions, xPermissions]
  );

  const methods = useForm({ defaultValues });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  // Reset form when xPermissions updates
  useEffect(() => {
    if (permissions?.length > 0) {
      reset(ProfilesFormValues(permissions, xPermissions));
    }
  }, [xPermissions, permissions, reset]);

  const onSubmit = async (formData) => {
    try {
      const allPermissions = formData.permissions || {};
      const selectedPermissions = Object.entries(allPermissions)
        .filter(([_, value]) => value === true || value === 1)
        .map(([key]) => parseInt(key));

      const body = {
        profile_id: Number(record?.id),
        permissions: JSON.stringify(selectedPermissions),
      };

      const response = await POST(
        crm_endpoints?.profile_permissions?.save,
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

  if (loading) return <Loader />;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion type="multiple" className="w-full border">
          {(permissions || []).map((category) => (
            <AccordionItem
              key={category.id ?? `category-${category.title}`}
              value={`category-${category.id}`}
              className="border-b"
            >
              <AccordionTrigger className="text-base font-semibold">
                {category.title}
              </AccordionTrigger>
              <AccordionContent className="mt-2">
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-1 border w-1/4 text-muted-foreground">
                          SECTION
                        </th>
                        <th className="text-left px-4 py-1 border text-muted-foreground">
                          PERMISSIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(category.groups || []).map((group) => (
                        <tr
                          key={group.id ?? `group-${group.title}`}
                          className="border-t"
                        >
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {group.title} 
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-4">
                              {(group.permissions || []).map((permission) => (
                                <div
                                  key={
                                    permission.id ?? `perm-${permission.title}`
                                  }
                                  className="flex items-center space-x-2"
                                >
                                {xPermissions.includes(permission.id)}
                                  <CheckboxOrRadio
                                    name={`permissions.${permission.id}`}
                                    type="checkbox"
                                    title={permission.title || ""}
                                    label={permission.title || ""}
                                    isChecked={xPermissions.includes(
                                      parseInt(permission.id)
                                    )}
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6">
          <SubmitBtn isSubmitting={isSubmitting} />
        </div>
      </form>
    </FormProvider>
  );
}
