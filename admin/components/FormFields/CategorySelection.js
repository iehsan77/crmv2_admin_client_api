"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

export default function CategorySelector({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  value,
  onChange,
  id,
  categories = [], // initial category tree
}) {
  const inputId = id || `category-${Math.random().toString(36)}`;
  const [isOpen, setIsOpen] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const currentOptions = breadcrumb.reduce((acc, cur) => {
    return acc?.find((item) => item.label === cur)?.children || [];
  }, categories);

  const handleSelect = (category) => {
    const selectedPath = [...breadcrumb, category.label];
    if (!category.children) {
      setBreadcrumb(selectedPath);
      onChange && onChange(selectedPath.join(" > "));
      setIsOpen(false);
    } else {
      setBreadcrumb(selectedPath);
    }
  };

  const handleBreadcrumbRemove = (index) => {
    const newPath = breadcrumb.slice(0, index);
    setBreadcrumb(newPath);
  };

  return (
    <div className="relative">
      {/* Label */}
      <label htmlFor={inputId} className="block text-sm text-gray-600 mb-1">
        {label}
        {tooltip && (
          <span className="ml-1 text-xs text-gray-400 relative group">
            <Icon icon="mdi:information" className="inline-block h-4 w-4" />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs p-1 rounded hidden group-hover:block z-10 whitespace-nowrap">
              {tooltip}
            </span>
          </span>
        )}
      </label>

      {/* Input like selector */}
      <div
        className={clsx(
          "w-full border px-3 py-2 rounded text-sm cursor-pointer bg-white",
          error ? "border-red-500" : "border-gray-300",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value ? (
          <span className="text-gray-800">{value}</span>
        ) : (
          <span className="text-gray-400">Select a category</span>
        )}
      </div>

      {/* Error + HelperText */}
      {error ? (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      ) : (
        helperText && <div className="text-xs text-gray-500 mt-1">{helperText}</div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded shadow-lg w-full max-h-80 overflow-auto p-2 space-y-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search category..."
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Breadcrumbs */}
          <div className="text-xs text-gray-600 mb-2">
            {breadcrumb.map((b, i) => (
              <span
                key={i}
                className="cursor-pointer hover:underline"
                onClick={() => handleBreadcrumbRemove(i)}
              >
                {b} {i < breadcrumb.length - 1 ? ">" : ""}
              </span>
            ))}
          </div>

          {/* Category Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentOptions
              .filter((opt) =>
                opt.label.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((opt, i) => (
                <div
                  key={i}
                  className="cursor-pointer text-sm text-gray-dark hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

