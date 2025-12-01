"use client";

import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import Select from "react-select";

// ---------------------------

export default function SelectControl({
  name,
  title,
  placeholder = "Select...",
  isMulti = false,
  className = "",
  innerDivClassName = "",
  resetField,
  resetValue,
  isLoading = false,
  options = [],
  defaultValue,
  required = false,
  vertical = true,
  ...other
}) {
  const { control, setValue } = useFormContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (defaultValue !== undefined) {
      setValue(name, defaultValue);
    }
  }, [defaultValue, name, setValue]);

  const customStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        boxShadow: "none",
        border: `1px solid ${state.isFocused ? "#3b82f6" : "#ccc"}`,
        borderRadius: 0,
        padding: "2px 5px",
        backgroundColor: "#fff",
      }),
      singleValue: (base) => ({
        ...base,
        color: "#000",
      }),
      placeholder: (base) => ({
        ...base,
        color: "#888",
      }),
      indicatorSeparator: () => ({ display: "none" }),
      loadingIndicator: (base) => ({
        ...base,
        color: "#3369bd",
      }),
    }),
    []
  );

  if (!isClient) return null;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue || (isMulti ? [] : null)}
      render={({ field, fieldState: { error } }) => (
        <div className={`${className} flex flex-col`}>
          <div
            className={`grid md:grid-cols-4 ${
              vertical ? "gap-2" : "gap-2 md:gap-4 items-center justify-center"
            }`}
          >
            {title && (
              <div
                className={`${
                  vertical ? "col-span-4" : "col-span-1 md:text-right"
                }`}
              >
                <label htmlFor={name} className="text-sm text-gray-600 mb-1">
                  {title}
                  {required && <span className="text-red-600 ms-1">*</span>}
                </label>
              </div>
            )}
            <div
              className={`relative w-full ${
                vertical ? "col-span-4" : "col-span-3"
              }`}
            >
              <Select
                {...field}
                ref={field.ref}
                placeholder={placeholder}
                isMulti={isMulti}
                isLoading={isLoading}
                options={options}
                styles={customStyles}
                onChange={(selected) => {
                  field.onChange(selected);
                  if (resetField && resetValue !== undefined) {
                    setValue(resetField, resetValue);
                  }
                }}
                value={field.value}
                {...other}
              />
            </div>

            {error?.message && (
              <p
                className={`text-xs text-red-500 mt-1 col-span-4 ${
                  !vertical ? "col-start-2" : ""
                }`}
              >
                {error.message}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}

// ---------------------------

SelectControl.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  isMulti: PropTypes.bool,
  className: PropTypes.string,
  innerDivClassName: PropTypes.string,
  resetField: PropTypes.string,
  resetValue: PropTypes.any,
  isLoading: PropTypes.bool,
  options: PropTypes.array.isRequired,
  defaultValue: PropTypes.any,
  required: PropTypes.bool,
  vertical: PropTypes.bool,
};
