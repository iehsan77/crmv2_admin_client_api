"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function PasswordInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  value,
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

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
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <Icon
                icon={icon}
                className={`h-5 w-5 ${
                  error ? "text-red-500" : "text-gray-400"
                } group-focus-within:text-primary`}
              />
            </div>
          )}

          {/* Input */}
          <input
            id={inputId}
            {...props}
            type={showPassword ? "text" : "password"}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            className={`bg-white text-gray-dark w-full py-1 text-sm focus:outline-none peer ${
              icon ? "pl-10" : "pl-2"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          />

          {/* Label */}
          <label
            htmlFor={inputId}
            className={`absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
              icon ? "left-10" : "left-0"
            } ${
              error ? "text-red-500" : "peer-focus:text-primary"
            } peer-placeholder-shown:text-sm peer-placeholder-shown:top-1 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3 -top-3 text-xs`}
          >
            {label}
          </label>

          {/* Password Toggle */}
          <button
            type="button"
            className="absolute inset-y-0 right-2 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            <Icon
              icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
              className="h-5 w-5 text-gray-400 hover:text-primary transition-colors"
            />
          </button>

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute inset-y-0 right-8 flex items-center">
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

        {/* Helper Text */}
        {helperText && !error && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}

        {/* Error Message */}
        {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
