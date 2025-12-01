"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ecom_endpoints } from "@/utils/ecom_endpoints";
import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import { Button } from "@/components/ui/button";
import {handleResponse} from "@/helper/ClientSideActions";
import { POST, POST_JSON } from "@/helper/ServerSideActions";;
import { formSchema } from "./formSchema";
import { getFormValues } from "./formValues";
import Drawer from "@/components/Drawer";
import { getDropdownFormattedData } from "@/helper/EcomActions";

const AddEdit = ({ isOpen, onClose, onSave, record }) => {

  // STATE
  const [attributesData, setAttributesData] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [colorInputStyle, setColorInputStyle] = useState("");
  const [inputType, setInputType] = useState("text");

  // PAGE CONFIG
  const attributesUrl = ecom_endpoints?.products?.attributes?.list;
  const addRecordUrl = ecom_endpoints.products.attributeValues.create;
  const addTitle = "Add Attribute Value";
  const editTitle = "Edit Attribute Value";

  // FORM HOOKS
  const defaultValues = useMemo(() => getFormValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, control, handleSubmit, setValue, formState } = methods;
  const { isSubmitting } = formState;

  // FETCH ATTRIBUTES
  const fetchAttributes = useCallback(async () => {

    setAttributesLoading(true);
    try {
      const body = {
        showAll: true,
      };
      const response = await POST_JSON(attributesUrl, body);

      if (response?.status === 200) {
        setAttributesData(response.data);
        setAttributes(getDropdownFormattedData(response.data));
      }
    } catch (error) {
      console.error("Error fetching product records:", error);
    } finally {
      setAttributesLoading(false);
    }
  }, [attributesUrl]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // HANDLE ATTRIBUTE SELECTION
  const attribute = watch("attribute_id");
  useEffect(() => {
    if (attribute?.value && attributesData?.length) {
      const foundAttribute = attributesData.find(
        (attr) => attr.id === Number(attribute.value)
      );
      if (foundAttribute) {
        setColorInputStyle(
          foundAttribute.input_type === "color" ? "color-input-container" : ""
        );
        setInputType(foundAttribute.input_type);
      }
    }
  }, [attribute?.value, attributesData]);

  // FOR EDIT MODE
  useEffect(() => {
    if (record?.attribute_id && attributesData?.length) {
      const foundAttribute = attributesData.find(
        (attr) => attr.id === Number(record.attribute_id)
      );
      if (foundAttribute) {
        setValue("attribute_id", {
          value: foundAttribute.id,
          label: foundAttribute.title,
        });
        setColorInputStyle(
          foundAttribute.input_type === "color" ? "color-input-container" : ""
        );
        setInputType(foundAttribute.input_type);
      }
    }
  }, [record?.attribute_id, attributesData, setValue]);

  // SUBMIT HANDLER
  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        attribute_id: formData.attribute_id.value,
        active: parseInt(formData?.active?.value, 10),
      };

      const response = await POST(addRecordUrl, body);

      if (response?.status === 200 || response?.status === 201) {
        onSave(response.data);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    !loading && (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={record ? editTitle : addTitle}>
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Attribute Selection */}
            <div className="grid lg:grid-cols-1">
              <SelectControl
                name="attribute_id"
                placeholder="Select attribute"
                options={attributes}
                isLoading={attributesLoading}
              />
            </div>

            {/* Attribute Value Input */}
            <div className="grid lg:grid-cols-1">
              <InputControl
                name="title"
                type={inputType}
                placeholder="Attribute value"
                className={colorInputStyle}
              />
            </div>

            {/* Active Status Selection */}
            <div className="grid lg:grid-cols-1">
              <SelectControl
                name="active"
                placeholder="Is Active"
                options={[
                  { value: "", label: "Select" },
                  { value: "1", label: "Yes" },
                  { value: "0", label: "No" },
                ]}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center lg:justify-end mt-4">
              <Button variant="outline" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
            </div>
          </div>
        </FormProvider>
      </Drawer>
    )
  );
};

export default AddEdit;
