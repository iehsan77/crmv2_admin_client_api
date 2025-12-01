"use client";
import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

export default function MultiSelectInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  loading = false,
  placeholder = " ",
  options = [],
  value = [],
  onChange,
  id,
  clearError,
  name,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredOptions = options
    ?.filter(
      (option) =>
        option?.label?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !value.includes(option.value)
    )
    ?.sort((a, b) => {
      if (a.disabled && !b.disabled) return 1;
      if (!a.disabled && b.disabled) return -1;
      return 0;
    });

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const optionElement = dropdownRef.current.children[focusedIndex];
      if (optionElement) {
        optionElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  const handleSelect = (option) => {
    if (loading || disabled) return;
    onChange([...value, option.value]);
    setSearchTerm("");
    setFocusedIndex(0);

    if (clearError) clearError();

    inputRef.current?.focus();
  };

  const handleRemove = (val, e) => {
    e.stopPropagation();
    if (loading || disabled) return;
    onChange(value.filter((v) => v !== val));

    if (clearError) clearError();
  };

  const handleClear = () => {
    if (loading || disabled) return;
    onChange([]);
    setSearchTerm("");

    if (clearError) clearError();
  };

  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (isOpen && focusedIndex >= 0) {
          e.preventDefault();
          handleSelect(filteredOptions[focusedIndex]);
        } else if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex((prev) =>
          Math.min(prev + 1, filteredOptions.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Backspace":
        if (searchTerm === "" && value.length > 0) {
          onChange(value.slice(0, -1));
          if (clearError) clearError();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectedItems = options.filter((option) =>
    value.includes(option.value)
  );

  return (
    <div>
      <div className="w-full relative group" ref={wrapperRef}>
        <div
          className={`relative border-b ${
            error ? "border-red-500" : "border-gray-dark"
          } focus-within:border-primary transition-all min-h-[28px] py-0.5 flex flex-wrap items-center gap-1 ${
            value.length > 0 && icon ? "pl-10" : "pl-1"
          } ${disabled || loading ? "opacity-70" : ""}`}
          onClick={() => !disabled && !loading && inputRef.current?.focus()}
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

          {/* Selected Chips */}
          {selectedItems.map((item) => (
            <div
              key={item.value}
              className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 text-sm"
            >
              {item?.icon && item?.icon}
              <span>{item.label}</span>
              {!loading && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(item.value, e)}
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
              value={searchTerm}
              onChange={(e) => {
                if (loading || disabled) return;
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setFocusedIndex(0);
              }}
              onFocus={() => {
                if (loading || disabled) return;
                setIsOpen(true);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled || loading}
              placeholder={value.length === 0 ? placeholder : ""}
              className={`focus:outline-none bg-transparent w-full placeholder:text-gray-dark ${
                disabled || loading ? "cursor-not-allowed" : ""
              }`}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
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

          {/* Chevron */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loading ? (
              <Icon
                icon="mdi:loading"
                className="h-5 w-5 animate-spin text-gray-400"
              />
            ) : (
              <Icon
                icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="h-5 w-5 text-gray-400"
              />
            )}
          </div>

          {/* Label */}
          <label
            className={`text-sm absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
              icon ? "left-10" : "left-0"
            } ${error ? "text-red-500" : "peer-focus:text-primary"} ${
              value.length > 0 || searchTerm || isOpen
                ? "text-xs -top-5 left-0"
                : "peer-placeholder-shown:text-sm peer-placeholder-shown:top-0 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-5"
            } ${disabled || loading ? "cursor-not-allowed" : ""}`}
          >
            {label}
          </label>

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

        {/* Dropdown */}
        {isOpen && !disabled && !loading && (
          <div
            ref={dropdownRef}
            className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {searchTerm ? "No matches found" : "No options available"}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`text-sm px-3 py-2 ${
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer hover:bg-primary/10 hover:text-primary"
                  } flex items-center gap-2`}
                  onClick={() => {
                    if (!option.disabled) handleSelect(option);
                  }}
                  role="option"
                  aria-selected={index === focusedIndex}
                  aria-disabled={option.disabled}
                >
                  {option?.icon && option?.icon}
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}

        {/* Helper/Error Text */}
        {helperText && !error && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}
        {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
