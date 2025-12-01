"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function LookupInput({
  title,
  icon,
  options = [],
  error,
  helperText,
  tooltip,
  required,
  ...props
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>

      <div
        className={`relative rounded-md shadow-sm border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-200 ${
          required
            ? "border-l-red-400 border-l-3 focus-within:border-y-blue-500 focus-within:border-r-blue-500 focus-within:ring-1 focus-within:ring-blue-500 group-hover:border-y-gray-400 group-hover:border-r-gray-400"
            : "group-hover:border-gray-400"
        } ${error ? "border-red-500" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon
            icon={icon}
            className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
          />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="text-sm block w-full pl-10 pr-10 py-2 rounded-md bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
          placeholder="Search..."
        />

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center"
                  onMouseDown={() => {
                    setSearchTerm(option.label);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No results found
              </div>
            )}
          </div>
        )}

        {/* Chevron Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" />
        </div>

        {/* Tooltip Icon */}
        {tooltip && (
          <div className="absolute top-1/2 -translate-y-1/2 right-8 flex items-center">
            <div className="relative group/tooltip">
              <Icon
                icon="mdi:information"
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block transition-opacity duration-200 z-10">
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

      <input type="hidden" {...props} />
    </div>
  );
}
