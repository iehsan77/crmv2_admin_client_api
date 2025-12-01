"use client";
import { Icon } from "@iconify/react";

export default function AutoNumberInput({
  title,
  icon,
  error,
  helperText,
  tooltip,
  required,
  ...props
}) {
  return (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>

      <div
        className={`relative rounded-md shadow-sm border bg-gray-50 transition-all duration-200 ${
          required
            ? "border-l-red-400 border-l-3 focus-within:border-y-blue-500 focus-within:border-r-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-y-gray-400 group-hover:border-r-gray-400"
            : "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-gray-400"
        } ${error ? "border-red-500" : "border-gray-300"}`}
      >
        {/* Left Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              icon={icon}
              className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
            />
          </div>
        )}

        {/* Input */}
        <input
          readOnly
          {...props}
          className={`text-sm block w-full py-2 pr-3 rounded-md bg-transparent focus:outline-none text-gray-500 cursor-not-allowed placeholder-gray-400 ${
            icon ? "pl-10" : "pl-3"
          } ${tooltip ? "pr-10" : ""}`}
        />

        {/* Tooltip Icon */}
        {tooltip && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="relative group/tooltip">
              <Icon
                icon="mdi:information"
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block transition-opacity duration-200">
                {tooltip}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}

      {/* Error Text */}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}
