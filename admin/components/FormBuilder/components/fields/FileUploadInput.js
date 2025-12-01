"use client";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

export default function FileUploadInput({
  title,
  icon,
  error,
  helperText,
  tooltip,
  required,
  ...props
}) {
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  return (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>
      <div
        className={`relative rounded-md shadow-sm border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-200 group-hover:border-gray-400 ${
          required ? "border-l-red-400 border-l-3" : ""
        } ${error ? "border-red-500" : ""}`}
        onClick={() => fileInputRef.current.click()}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon
            icon={icon}
            className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          {...props}
        />
        <div className="pl-10 pr-16 py-2 cursor-pointer">
          {fileName ? (
            <span className="text-sm text-gray-900 truncate block">
              {fileName}
            </span>
          ) : (
            <span className="text-sm text-gray-500">Choose a file...</span>
          )}
        </div>
        <div className="absolute inset-y-0 right-6 pr-3 flex items-center">
          <button
            type="button"
            className="text-sm text-[#1E3A8A] hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current.click();
            }}
          >
            Browse
          </button>
        </div>
        {/* Tooltip */}
        {tooltip && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="relative group/tooltip">
              <Icon
                icon={"mdi:information"}
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              {tooltip && (
                <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block transition-opacity duration-200">
                  {tooltip}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}

      {/* Helper Text */}
      {helperText && !error && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}
    </div>
  );
}
