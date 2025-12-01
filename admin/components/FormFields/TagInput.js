"use client";
import { useState, useRef } from "react";
import { Icon } from "@iconify/react";

export default function TagInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  loading = false,
  placeholder = "",
  value = [],
  onChange,
  clearError,
  name,
  ...props
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
      if (clearError) clearError();
    }

    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      if (clearError) clearError();
    }
  };

  const handleRemove = (tag, e) => {
    e.stopPropagation();
    if (disabled || loading) return;
    onChange(value.filter((t) => t !== tag));
    if (clearError) clearError();
  };

  const handleClear = () => {
    if (disabled || loading) return;
    onChange([]);
    setInputValue("");
    if (clearError) clearError();
  };

  return (
    <div>
      <div className="w-full relative group">
        <div
          className={`relative border-b ${
            error ? "border-red-500" : "border-gray-dark"
          } focus-within:border-primary transition-all min-h-[28px] py-0.5 flex flex-wrap items-center gap-1 ${
            value.length > 0 && icon ? "pl-10" : "pl-1"
          } ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && !loading && inputRef.current?.focus()}
        >
          {/* Left Icon */}
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

          {/* Selected Chips */}
          {value.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 text-sm"
            >
              <Icon icon="mdi:tag-outline" className="h-4 w-4 text-gray-500" />
              <span>{tag}</span>
              {!loading && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(tag, e)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={disabled || loading}
                >
                  <Icon icon="mdi:close" className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Input */}
          <div className={`flex-1 ${icon ? "pl-10" : "pl-2"}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || loading}
              placeholder={value.length === 0 ? placeholder : ""}
              className={`focus:outline-none bg-transparent w-full placeholder:text-gray-dark ${
                disabled || loading ? "cursor-not-allowed" : ""
              }`}
              {...props}
            />
          </div>

          {/* Clear Button */}
          {!loading && value.length > 0 && !disabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-8 text-gray-400 hover:text-red-500"
              disabled={loading}
            >
              <Icon icon="mdi:close-circle" className="h-4 w-4" />
            </button>
          ) : null}

          {/* Chevron (just for consistency with your style) */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loading ? (
              <Icon
                icon="mdi:loading"
                className="h-5 w-5 animate-spin text-gray-400"
              />
            ) : (
              <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Label */}
          {label && (
            <label
              className={`absolute left-0 cursor-text truncate max-w-[calc(100%-18px)]
      ${icon ? "left-10" : "left-0"}
      ${error ? "text-red-500" : "group-focus-within:text-primary group-focus-within:text-xs group-focus-within:-top-3"}
      transition-all duration-200
      ${disabled || loading ? "cursor-not-allowed" : ""}
      ${
        value.length > 0 || inputValue.length > 0
          ? "text-xs -top-3"
          : "text-sm top-0 text-gray-light"
      }
    `}
            >
              {label}
            </label>
          )}

          {/* Tooltip */}
          {tooltip && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              <div className="relative group/tooltip">
                <Icon
                  icon="mdi:information"
                  className={`h-4 w-4 ${
                    disabled || loading ? "text-gray-300" : "text-gray-400"
                  } cursor-pointer`}
                />
                <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                  {tooltip}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Helper/Error Text */}
        {helperText && !error && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}
        {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
