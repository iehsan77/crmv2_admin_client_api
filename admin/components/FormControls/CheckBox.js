"use client";
import React from "react";
import PropTypes from "prop-types";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";

CheckBox.propTypes = {
  name: PropTypes.string.isRequired, // should be something like "user_selected_modules"
  value: PropTypes.string.isRequired, // module ID as string
  label: PropTypes.string, // optional
  labelClassName: PropTypes.string, // optional
};

export default function CheckBox({ name, value, label, labelClassName, ...other }) {
  const { watch, setValue } = useFormContext();
  const selectedValues = watch(name) || [];

  const isChecked = selectedValues.includes(value);

  const handleChange = (checked) => {
    const updatedValues = checked
      ? [...selectedValues, value]
      : selectedValues.filter((v) => v !== value);

    setValue(name, updatedValues, { shouldValidate: true });
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleChange}
        id={value}
        {...other}
      />
      {label && (
        <label htmlFor={value} className={`text-sm cursor-pointer ${labelClassName}`}>
          {label}
        </label>
      )}
    </div>
  );
}
