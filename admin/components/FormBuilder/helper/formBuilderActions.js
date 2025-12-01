// helpers/FormBuilderActions.js
import { POST } from "@/helper/ServerSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { handleResponse } from "@/helper/ClientSideActions";
import toast from "react-hot-toast";

/**
 * Save form to server
 */
export const saveForm = async (formFields, mainData, saveFormData) => {
  const { app_id, module_id, layout_id } = mainData[0];

  if (!app_id || !module_id || !layout_id) {
    alert("Please select App, Module, and Layout before saving.");
    return false;
  }

  const processedFields = formFields.map((s) => ({
    ...s,
    fields: s.fields.map((f) => ({
      ...f,
      name: f.attributes
        .find((a) => a.attribute === "label")
        ?.value?.toLowerCase()
        ?.replace(/\s+/g, "_"),
    })),
  }));

  const payload = {
    //...mainData[0],
    id:layout_id,
    form: JSON.stringify(processedFields),
    tenant_id:0
  };

  saveFormData(payload);

  try {
    const response = await POST(crm_endpoints?.layouts?.saveDefaultForm, payload);
    if (response?.status === 200) {
      toast.success("Form saved successfully");
      return true;
    } else {
      handleResponse(response);
      return false;
    }
  } catch (error) {
    console.error("Save error:", error);
    toast.error("Something went wrong");
    return false;
  }
};

export const saveAndCloseForm = async ({
  formFields,
  mainData,
  saveFormData,
  router,
}) => {
  const saved = await saveForm(formFields, mainData, saveFormData);
  if (saved) {
    router.push("/");
  }
};
