"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";

export default function CheckboxSelectionButton({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  options = [],
  value = [],
  onChange,
  id,
  ...props
}) {
  const inputId = id || `checkbox-${Math.random().toString(36)}`;

  const handleToggle = (selectedValue) => {
    if (disabled || !onChange) return;

    let newValue;

    if (options.length === 1) {
      // Only one option allowed, so toggle it directly
      newValue = value.includes(selectedValue) ? [] : [selectedValue];
    } else {
      newValue = value.includes(selectedValue)
        ? value.filter((val) => val !== selectedValue)
        : [...value, selectedValue];
    }

    onChange(newValue);
  };

  return (
    <div>
      <div className="w-full relative group">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              "block text-sm mb-2",
              error ? "text-red-500" : "text-gray-dark"
            )}
          >
            {label}
          </label>
        )}

        {/* Checkbox Buttons Container */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = value.includes(option.value);

            return (
              <div
                key={option.value}
                className={clsx(
                  "relative inline-flex items-center justify-center px-4 py-2 rounded-md cursor-pointer transition-all",
                  isSelected
                    ? "bg-secondary text-white"
                    : "bg-[#F2F2F2] text-gray-400",
                  disabled ? "cursor-not-allowed opacity-50" : ""
                )}
                onClick={() => handleToggle(option.value)}
              >
                {/* Icon */}
                {option.icon && (
                  <Icon
                    icon={option.icon}
                    className={clsx(
                      "mr-2 h-4 w-4",
                      isSelected ? "text-primary" : "text-gray-light"
                    )}
                  />
                )}

                {/* Option Label */}
                <span className="text-xs">{option.label}</span>

                {/* Hidden Checkbox Input */}
                <input
                  type="checkbox"
                  id={`${inputId}-${option.value}`}
                  checked={isSelected}
                  onChange={() => handleToggle(option.value)}
                  className="absolute opacity-0 w-0 h-0"
                  disabled={disabled}
                  {...props}
                />
              </div>
            );
          })}
        </div>

        {/* Tooltip and helper text */}
        <div className="flex items-center mt-1">
          {tooltip && (
            <div className="flex items-center mr-2">
              <div className="relative group/tooltip">
                <Icon
                  icon={"mdi:information"}
                  className="h-4 w-4 text-gray-400 cursor-pointer"
                />
                <div className="absolute bottom-full left-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                  {tooltip}
                </div>
              </div>
            </div>
          )}

          {helperText && !error && (
            <span className="text-xs text-gray-500">{helperText}</span>
          )}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
