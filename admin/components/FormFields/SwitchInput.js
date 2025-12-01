"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function SwitchInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled = false,
  value = 0,
  onChange,
  id,
  name,
  ...props
}) {
  const inputId = id || `switch-${Math.random().toString(36)}`;
  const [internalValue, setInternalValue] = useState(value);

  const handleToggle = () => {
    if (!disabled) {
      const newValue = internalValue ? 0 : 1;
      setInternalValue(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div>
      <div className="w-full relative group">
        {/* Input Container */}
        <div className={`relative ${error ? "border-b border-red-500" : ""}`}>
          {/* Icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <Icon
                icon={icon}
                className={`h-5 w-5 ${
                  error ? "text-red-500" : "text-gray-400"
                }`}
              />
            </div>
          )}

          {/* Switch Container */}
          <div className={`flex items-center ${icon ? "pl-10" : ""}`}>
            {/* Hidden Input */}
            <input
              type="checkbox"
              id={inputId}
              name={name}
              checked={!!internalValue}
              onChange={handleToggle}
              className="hidden"
              disabled={disabled}
              {...props}
            />

            {/* Label */}
            <label
              htmlFor={inputId}
              className={`text-gray-light cursor-text truncate ${
                error ? "text-red-500" : ""
              }`}
            >
              {label}
            </label>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggle}
              disabled={disabled}
              className={`ml-auto relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              } ${internalValue ? "bg-primary" : "bg-gray-300"}`}
            >
              <span
                className={`${
                  internalValue ? "translate-x-6" : "translate-x-1"
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </button>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute inset-y-0 right-2 flex items-center">
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

        <div className="flex items-center justify-between mt-1">
          {/* Helper Text */}
          {helperText && !error && (
            <div className="text-[10px] text-gray-500">{helperText}</div>
          )}

          {/* Value Indicator
          <div className="ml-auto text-xs text-gray-400">
            {internalValue ? "On (1)" : "Off (0)"}
          </div> */}
        </div>

        {/* Error Message */}
        {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
