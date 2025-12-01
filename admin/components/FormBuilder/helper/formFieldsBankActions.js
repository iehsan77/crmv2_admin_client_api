// helpers/FormBuilderActions.js
import { POST } from "@/helper/ServerSideActions";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { handleResponse } from "@/helper/ClientSideActions";
import toast from "react-hot-toast";

/**
 * Save form to server
 */
export const saveForm = async (formFields, mainData, saveFormData) => {

  const { module_id } = mainData[0];

  if (!module_id) {
    alert("Please select Module before saving.");
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
    ...mainData[0],
    form: JSON.stringify(processedFields),
  };


  saveFormData(payload);

  try {

    const response = await POST(crm_endpoints?.feildsBank?.save, payload);
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
    router.push(ADMIN_PATHS?.SETTINGS?.COMPANY);
  }
};
