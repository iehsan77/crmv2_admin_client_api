"use client";
import React from "react";
import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";

CheckboxOrRadio.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["checkbox", "radio"]).isRequired,
  value: PropTypes.any, // required for radio
  isChecked: PropTypes.bool,
};

export default function CheckboxOrRadio({ name, label, type, value, isChecked=false, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const isRadio = type === "radio";
        
        const isChecked = isRadio
          ? field.value === value
          : Boolean(field.value);
          

        return (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type={type}
                value={value}
                checked={isChecked}
                onChange={(e) =>
                  field.onChange(
                    isRadio ? value : e.target.checked ? 1 : 0
                  )
                }
                className="accent-blue-600"
                {...other}
              />
              <span className="text-sm">{label}</span>
            </label>
            {error?.message && (
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}
