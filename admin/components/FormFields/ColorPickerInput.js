"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

export default function ColorPickerInput({
  label,
  icon = "mdi:palette",
  error,
  helperText,
  tooltip,
  disabled,
  value = "#000000",
  onChange,
  id,
}) {
  const [selectedColor, setSelectedColor] = useState(value || "#000000");
  const colorInputRef = useRef(null);

  useEffect(() => {
    if (value) setSelectedColor(value);
  }, [value]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    onChange?.(newColor);
  };

  return (
    <div className="relative w-full group">
      {/* Input wrapper */}
      <div
        className={`relative border-b ${error ? "border-red-500" : "border-gray-dark"} 
          focus-within:border-primary transition-all py-1 flex items-center 
          ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {/* Icon */}
        <div className="absolute left-0 pl-1 flex items-center pointer-events-none">
          <Icon
            icon={icon}
            className={`h-5 w-5 ${error ? "text-red-500" : "text-gray-400"}`}
          />
        </div>

        {/* Display color hex and preview */}
        <div
          className={`pl-8 flex-1 text-sm truncate ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !disabled && colorInputRef.current?.click()}
        >
          {selectedColor}
        </div>

        <div
          className="w-5 h-5 rounded-full border ml-2"
          style={{ backgroundColor: selectedColor }}
        ></div>

        {/* Hidden color input */}
        <input
          type="color"
          ref={colorInputRef}
          value={selectedColor}
          onChange={handleColorChange}
          disabled={disabled}
          className="absolute opacity-0 pointer-events-none"
        />
      </div>

      {/* Label */}
      {label && (
        <label className="text-sm absolute left-8 top-[-16px] text-gray-light">
          {label}
        </label>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute right-6 top-1">
          <Icon icon="mdi:information" className="h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Helper/Error Text */}
      {helperText && !error && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}