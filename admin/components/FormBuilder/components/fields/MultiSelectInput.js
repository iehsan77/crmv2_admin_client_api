"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function MultiSelectInput({
  title,
  icon,
  options = [],
  helperText,
  tooltip,
  error,
  required,
  ...props
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const toggleOption = (option) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>

      <div
        className={`relative rounded-md shadow-sm border border-gray-300 bg-white transition-all duration-200 ${
          required
            ? "border-l-red-400 border-l-3 focus-within:border-y-blue-500 focus-within:border-r-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-y-gray-400 group-hover:border-r-gray-400"
            : "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-gray-400"
        } ${error ? "border-red-500" : ""}`}
      >
        {/* Left Icon */}
        <div className="absolute top-3 left-3">
          <Icon
            icon={icon}
            className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
          />
        </div>

        {/* Multi Option Selector */}
        <div className="pl-10 pr-10 py-2">
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 transition-colors ${
                  selectedOptions.includes(option.value)
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}
              >
                {selectedOptions.includes(option.value) && (
                  <Icon icon="mdi:check" className="h-4 w-4" />
                )}
                {option.label}
              </button>
            ))}
          </div>

          {/* Hidden input */}
          <input type="hidden" value={selectedOptions.join(",")} {...props} />
        </div>

        {/* Info Icon */}
        {tooltip && (
          <div className="absolute top-2.5 right-2.5">
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

      {/* Error Message */}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}
