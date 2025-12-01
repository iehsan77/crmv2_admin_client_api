"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

PasswordControl.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  isHidden: PropTypes.bool,
  vertical: PropTypes.bool,
  required: PropTypes.bool,
};

export default function PasswordControl({
  name,
  title,
  placeholder = "",
  className = "",
  isHidden = false,
  vertical = true,
  required = false,
  ...other
}) {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((showPassword) => !showPassword);
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                {...field}
                id={name}
                type={showPassword ? "text" : "password"}
                placeholder={
                  placeholder
                    ? placeholder.toLowerCase()
                    : title?.toLowerCase() || ""
                }
                className={`px-10 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  error ? "border-red-500" : "border-gray-300"
                } pr-10`} // space for icon
                {...other}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error?.message && (
              <p className="text-xs text-red-500 mt-1">{error.message}</p>
            )}
          </div>
        </div>
      )}
    />
  );
}
