"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Icon } from "@iconify/react";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST } from "@/helper/ServerSideActions";

import AppModuleLayoutSelector from "@/components/AppModuleLayoutSelector";

//import useAppsStore from "@/stores/crm/useAppsStore";
//import useModulesStore from "@/stores/crm/useModulesStore";
import useUserStore from "@/stores/useUserStore";

import toast from "react-hot-toast";

export const FormBuilderTopBar = ({
  title = "Form Builder",
  onBack,
  onClose,
  onSave,
  onSaveAndClose,
  setValues,
  setFormFields,
}) => {
  const methods = useForm();
  const { watch, setValue } = methods;

  const app = watch("app");
  const module = watch("module");
  const layout = watch("layout");

  const { getUserApps, getModulesByAppId } = useUserStore();

  const [layoutsList, setLayoutsList] = useState([]);
  const [loading, setLoading] = useState({ app: false, module: false, layout: false });



  // When app changes
  useEffect(() => {
    const appId = app?.value;
    if (!appId) return;

    setLoading((prev) => ({ ...prev, module: true }));
    setValues((prev) => [{ ...prev[0], app_id: appId }]);
    setValue("module", null);
    setLayoutsList([]);
    setLoading((prev) => ({ ...prev, module: false }));
  }, [app]);


  useEffect(() => {
    const moduleId = module?.value;
    if (!moduleId) return;

    const loadLayouts = async () => {
      setLoading((prev) => ({ ...prev, layout: true }));
      try {
        setValues((prev) => [{ ...prev[0], module_id: moduleId }]);
        setValue("layout", null);

        const res = await POST(crm_endpoints?.layouts?.getByModule, {module_id:moduleId});

        const filtered = res?.data?.filter(
          (l) => String(l.module_id) === String(moduleId)
        );
        setLayoutsList(filtered || []);
      } catch (err) {
        console.error("Error fetching layouts", err);
        toast.error("Failed to fetch layouts.");
        setLayoutsList([]);
      } finally {
        setLoading((prev) => ({ ...prev, layout: false }));
      }
    };

    loadLayouts();
  }, [module]);

  // When layout changes
  useEffect(() => {
    const layoutId = layout?.value;
    const appId = app?.value;
    const moduleId = module?.value;

    if (!layoutId || !appId || !moduleId) return;

    const loadForm = async () => {
      try {
        setValues((prev) => [{ ...prev[0], layout_id: layoutId }]);
        setFormFields([]);

        /*
        const res = await POST(crm_endpoints.defaultForms.get, {
          app_id: appId,
          module_id: moduleId,
          layout_id: layoutId,
          //user_id: 0,
        });
        */
        const res = await POST(crm_endpoints?.layouts?.getById(layoutId));
        const formData = res?.data?.form;
        if (formData) {
          //setValues((prev) => [{ ...prev[0], id: formData.id, layout_id: layoutId }]);
          //setFormFields(JSON.parse(formData.form || "{}"));
          setFormFields(JSON.parse(formData || "{}"));
        } else {
          toast.error("No form found.");
        }

      } catch (err) {
        console.error("Error fetching form", err);
        toast.error("Error loading form data.");
        setLayoutsList([]);
      }
    };

    loadForm();
  }, [layout]);

  return (
    <div className="px-4 py-2 w-full bg-white border-b border-gray-200 flex items-center justify-between">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-100">
          <Icon icon="mdi:arrow-left" width="20" height="20" />
        </button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      {/* Center: Dropdowns */}
      <AppModuleLayoutSelector
        methods={methods}
        apps={getUserApps()}
        getModulesByAppId={getModulesByAppId}
        layoutsList={layoutsList}
        loading={loading}
      />

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
        >
          Close
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-[#3369bd] text-white rounded-md hover:bg-[#2c5ca3] text-sm font-medium"
        >
          Save
        </button>
        <button
          onClick={onSaveAndClose}
          className="px-4 py-2 bg-[#3369bd] text-white rounded-md hover:bg-[#2c5ca3] text-sm font-medium"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};
