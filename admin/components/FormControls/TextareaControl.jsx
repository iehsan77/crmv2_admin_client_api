"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";
import { useRef, useEffect } from "react";

TextareaControl.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  rows: PropTypes.number,
  icon: PropTypes.elementType,
  isHidden: PropTypes.bool,
  vertical: PropTypes.bool,
  required: PropTypes.bool,
  info: PropTypes.string,
  inputClass: PropTypes.string,
};

export default function TextareaControl({
  name,
  title,
  placeholder = "",
  className = "",
  rows = 4,
  isHidden = false,
  vertical = true,
  required = false,
  icon: Icon,
  info = "",
  inputClass = "",
  ...other
}) {
  const { control } = useFormContext();
  const textareaRef = useRef(null);

  // Auto resize on initial mount and value change
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field, fieldState: { error } }) => (
        <div className={`${className} flex flex-col`}>
          <div
            className={`grid md:grid-cols-4 ${
              vertical ? "gap-1" : "gap-1 md:gap-4 items-center justify-center"
            }`}
          >
            {title && (
              <div
                className={`${
                  vertical ? "col-span-4" : "col-span-1 md:text-right"
                } ${isHidden ? "hidden sm:block" : ""}`}
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
                <span className="absolute left-3 top-3 text-gray-400">
                  <Icon className="w-4 h-4" />
                </span>
              )}

              <textarea
                {...field}
                id={name}
                ref={(el) => {
                  textareaRef.current = el;
                  field.ref(el); // connect with RHF
                }}
                onInput={(e) => {
                  resizeTextarea();
                  field.onChange(e); // RHF onChange
                }}
                rows={rows}
                placeholder={
                  placeholder || title?.toLowerCase() || "Enter text..."
                }
                className={`resize-none overflow-hidden py-2 w-full border rounded-md multiple focus:ring-blue-500 focus:border-blue-500 ${inputClass} ${
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
              <p className="text-xs text-red-500 mt-1 col-span-4">
                {error.message}
              </p>
            )}
          </div>
        </div>
      )}
    />
  );
}
