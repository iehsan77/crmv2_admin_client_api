"use client";
import { Icon } from "@iconify/react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export default function ColorSelect({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  loading = false,
  placeholder = " ",
  options = [],
  value: val = null,
  onChange,
  clearError,
  id,
  hideValueRemoveIcon,
  optionEnd,
  ...props
}) {
  const [value, setValue] = useState(val);
  const [displayValue, setDisplayValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputId = id || `colorselect-${Math.random().toString(36)}`;
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setValue(val);
    const selectedOption = options.find((p) => p.value === val);
    setDisplayValue(selectedOption ? selectedOption.label : "");
  }, [val, options]);

  const filteredOptions = useMemo(() => {
    return options
      ?.filter((option) =>
        option?.label?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ?.sort((a, b) => {
        if (a.disabled && !b.disabled) return 1;
        if (!a.disabled && b.disabled) return -1;
        return 0;
      });
  }, [options, searchTerm]);

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

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (option) => {
      if (option && !option.disabled && !loading && !disabled) {
        onChange(option.value);
        setDisplayValue(option.label);
        if (clearError) clearError();
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    },
    [onChange, loading, disabled]
  );

  const handleClear = () => {
    if (loading || disabled) return;
    onChange(null);
    setDisplayValue("");
    setSearchTerm("");
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
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div className="w-full relative group" ref={wrapperRef}>
        <div
          className={`relative border-b ${
            error ? "border-red-500" : "border-gray-dark"
          } focus-within:border-primary transition-all min-h-[28px] flex items-center ${
            disabled || loading ? "opacity-70" : ""
          }`}
          onClick={() => !disabled && !loading && setIsOpen(true)}
        >
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-2">
              <Icon
                icon={icon}
                className={`h-5 w-5 ${
                  error ? "text-red-500" : "text-gray-400"
                } group-focus-within:text-primary`}
              />
            </div>
          )}

          <div
            className={`flex-1 ${
              icon ? "pl-10" : "pl-2"
            } flex items-center gap-2`}
          >
            {value ? (
              <div
                className="w-4 h-4 rounded-full border"
                style={{
                  backgroundColor:
                    options.find((opt) => opt.value === value)?.label || "#fff",
                }}
              />
            ) : null}
            <input
              ref={inputRef}
              // id={inputId}
              type="text"
              value={isOpen ? searchTerm : displayValue}
              onChange={(e) => {
                if (loading || disabled) return;
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setFocusedIndex(0);
              }}
              onFocus={() => {
                if (loading || disabled) return;
                setSearchTerm("");
                setIsOpen(true);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled || loading}
              placeholder={placeholder}
              className="text-sm focus:outline-none bg-transparent w-full placeholder:text-gray-dark"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              autoComplete="off"
              {...props}
            />
          </div>

          {!loading && value && !disabled && !hideValueRemoveIcon ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-8 text-gray-400 hover:text-red-500"
            >
              <Icon icon="mdi:close-circle" className="h-4 w-4" />
            </button>
          ) : null}

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

          <label
            // htmlFor={inputId}
            className={`text-sm absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
              icon ? "left-10" : "left-0"
            } ${error ? "text-red-500" : "peer-focus:text-primary"} ${
              value || searchTerm || isOpen
                ? "text-xs -top-3"
                : "peer-placeholder-shown:text-sm peer-placeholder-shown:top-0 peer-focus:text-xs peer-focus:-top-3"
            } ${disabled || loading ? "cursor-not-allowed" : ""}`}
          >
            {label}
          </label>
        </div>

        {isOpen && !disabled && !loading && (
          <div
            ref={dropdownRef}
            className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {loading ? "Loading options..." : "No options available"}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`text-sm flex items-center justify-between gap-2 ${
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "cursor-pointer hover:bg-primary/10 hover:text-primary"
                  } ${
                    value === option.value ? "bg-primary/10 text-primary" : ""
                  }`}
                  role="option"
                  aria-selected={index === focusedIndex}
                  aria-disabled={option.disabled}
                >
                  <div
                    className="flex items-center gap-2 grow px-3 py-2"
                    onClick={() => handleSelect(option)}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: option.label }}
                    />
                    {option.label}
                  </div>
                  {optionEnd && (
                    <div className="px-3 py-2"> {optionEnd(option)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {helperText && !error && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}
        {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
