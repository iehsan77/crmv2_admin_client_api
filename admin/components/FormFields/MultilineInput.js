"use client";
import { Icon } from "@iconify/react";

export default function MultilineInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  maxLength,
  rows = 2,
  id,
  ...props
}) {
  const inputId = id || `textarea-${Math.random().toString(36)}`;

  return (
    <div>
      <div className="w-full relative group">
        {/* Input Container */}
        <div
          className={`relative border-b ${
            error ? "border-red-500" : "border-gray-dark"
          } focus-within:border-primary transition-all`}
        >
          {/* Icon */}
          {icon && (
            <div className="absolute top-3 left-0 flex items-start pointer-events-none">
              <Icon
                icon={icon}
                className={`h-5 w-5 ${
                  error ? "text-red-500" : "text-gray-400"
                } group-focus-within:text-primary`}
              />
            </div>
          )}

          {/* Textarea */}
          <textarea
            id={inputId}
            {...props}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            className={`text-gray-dark w-full py-1 text-sm focus:outline-none peer resize-none ${
              icon ? "pl-10" : "pl-2"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          />

          {/* Label */}
          <label
            htmlFor={inputId}
            className={`text-sm absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
              icon ? "left-10" : "left-0"
            } ${
              error ? "text-red-500" : "peer-focus:text-primary"
            } peer-placeholder-shown:text-sm peer-placeholder-shown:top-2 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3 -top-3 text-xs`}
          >
            {label}
          </label>

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute top-3 right-2 flex items-center">
              <div className="relative group/tooltip">
                <Icon
                  icon={"mdi:information"}
                  className="h-4 w-4 text-gray-400 cursor-pointer"
                />
                <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                  {tooltip}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Helper Text */}
          {helperText && !error && (
            <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
          )}
          {error && (
            <div className="text-[10px] text-red-500 mt-1">{error}</div>
          )}
          {/* Character Counter
          {maxLength && (
            <div
              className={`ml-auto text-xs ${
                charCount > maxLength ? "text-red-500" : "text-gray-400"
              }`}
            >
              {charCount}/{maxLength}
            </div>
          )} */}
        </div>

        {/* Error Message */}
      </div>
    </div>
  );
}
