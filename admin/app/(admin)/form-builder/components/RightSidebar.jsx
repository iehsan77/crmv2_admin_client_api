"use client";

import { useCallback, useMemo } from "react";
import TextInput from "@/components/FormBuilder/components/fields/TextInput";
import CheckboxInput from "@/components/FormBuilder/components/fields/CheckboxInput";
import NumberInput from "@/components/FormBuilder/components/fields/NumberInput";
import TextareaInput from "@/components/FormBuilder/components/fields/TextareaInput";

export const RightSidebar = ({
  selectedSection,
  selectedField,
  updateFieldAttribute,
  findFieldAttr,
}) => {
  if (!selectedField || !selectedSection) return null;

  const handleChange = useCallback(
    (attrId, value) => {
      updateFieldAttribute(selectedSection.id, selectedField.id, attrId, value);
    },
    [selectedField?.id, selectedSection?.id, updateFieldAttribute]
  );

  const renderInput = useCallback(
    (attr) => {
      const attribute = findFieldAttr(selectedSection.id, selectedField.id, attr.id);
      if (!attribute) return null;

      const commonProps = {
        title: attr.title,
        label: attr.title,
        helperText: attr.info_text,
        placeholder: attr.title,
      };

      const onChangeValue = (e) => handleChange(attribute.id, e.target?.value);
      const onChangeChecked = (e) => handleChange(attribute.id, e.target?.checked);

      switch (attr.input_type) {
        case "text":
          return (
            <TextInput
              {...commonProps}
              value={attribute.value || ""}
              onChange={onChangeValue}
            />
          );
        case "textarea":
          return (
            <TextareaInput
              {...commonProps}
              value={attribute.value || ""}
              onChange={onChangeValue}
            />
          );
        case "number":
          return (
            <NumberInput
              {...commonProps}
              value={attribute.value ?? ""}
              onChange={onChangeValue}
            />
          );
        case "checkbox":
          return (
            <CheckboxInput
              {...commonProps}
              checked={!!attribute.value}
              onChange={onChangeChecked}
            />
          );
        default:
          return null;
      }
    },
    [selectedSection.id, selectedField.id, findFieldAttr, handleChange]
  );

  return (
    <div className="w-80 p-4 bg-[#efefef] overflow-y-auto h-full">
      <h2 className="text-lg font-bold mb-4">Field Properties</h2>
      <div className="space-y-4">
        {(selectedField.attributes || []).map((attr) => (
          <div key={attr.id}>{renderInput(attr)}</div>
        ))}
      </div>
    </div>
  );
};
