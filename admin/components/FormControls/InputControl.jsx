"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";

// ----------------------------------------------------------------------

InputControl.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  icon: PropTypes.elementType, // FIXED: pass icon component, not string
  isHidden: PropTypes.bool,
  vertical: PropTypes.bool,
  required: PropTypes.bool,
  info: PropTypes.string,
  inputClass: PropTypes.string,
};

export default function InputControl({
  name,
  title,
  placeholder = "",
  className = "",
  type = "text",
  isHidden = false,
  vertical = true,
  required = false,
  icon: Icon, // capitalized to use as a component
  info = "",
  inputClass = "",
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
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
                } ${isHidden && "hidden sm:block"}`}
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
              {Icon && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon className="w-4 h-4" />
                </span>
              )}

              <input
                {...field}
                id={name}
                type={type}
                placeholder={
                  placeholder
                    ? placeholder.toLowerCase()
                    : title?.toLowerCase() || ""
                }
                className={`py-2 w-full border focus:ring-blue-500 focus:border-blue-500 ${inputClass} ${
                  error ? "border-red-500" : "border-gray-300"
                } ${Icon ? "pl-10 pr-4" : "px-4"}`}
                {...other}
              />
            </div>
            {info && (
              <div className="text-light text-blue-800 text-xs col-span-4">
                {info}
              </div>
            )}
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
