import { NOIMAGE } from "@/constants/general_constants";

import InputControl from "@/components/FormControls/InputControl"; // make sure it exists


export function processFormData(data) {
  return data.map((section) => ({
    id: section.id,
    title: section.title,
    column: section.column || 2,
    fields: section.fields.map((field) => {
      const getAttr = (key) =>
        field.attributes.find((a) => a.attribute === key)?.value ?? "";

      return {
        id: field.id,
        name: field.name,
        label: getAttr("label") || field.title,
        type: field.form_element_type,
        inputType: field.type,
        required: getAttr("required") === true || getAttr("required") === "true",
        placeholder: getAttr("placeholder"),
        readonly: getAttr("readonly") === true || getAttr("readonly") === "true",
        disabled: getAttr("disabled") === true || getAttr("disabled") === "true",
        defaultValue: getAttr("value"),
        min: getAttr("min"),
        max: getAttr("max"),
        optional: getAttr("optional") === true || getAttr("optional") === "true",
      };
    }),
  }));
}


