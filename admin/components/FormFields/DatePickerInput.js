"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import "react-day-picker/dist/style.css";

// Previous 100 years range
function getPreviousYears() {
  const now = new Date();
  return new Date(now.getFullYear() - 100, now.getMonth());
}

// Next 100 years range
function getNextYears() {
  const now = new Date();
  return new Date(now.getFullYear() + 100, now.getMonth());
}

// ✅ Custom Caption for v9.11.0
function CustomCaption({ options, value, onChange, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownListRef = useRef(null);
  const selectedOptionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownListRef.current && selectedOptionRef.current) {
      const dropdown = dropdownListRef.current;
      const selectedElement = selectedOptionRef.current;
      
      // Scroll to selected option
      dropdown.scrollTop = selectedElement.offsetTop - dropdown.offsetTop - 50;
    }
  }, [isOpen]);

  const handleSelect = (newValue) => {
    // Event object simulate karte hain
    const syntheticEvent = {
      target: {
        value: newValue
      }
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value == value) || options[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 rounded-md min-w-[120px] bg-white hover:border-primary hover:shadow-sm transition-all duration-200"
      >
        <span className="font-medium">{selectedOption?.label || selectedOption?.value}</span>
        <Icon 
          icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"} 
          className="h-4 w-4 text-gray-500 ml-2"
        />
      </button>

      {isOpen && (
        <div 
          ref={dropdownListRef}
          className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-30"
        >
          <div className="py-1">
            {options.map((option) => {
              const isSelected = value == option.value;
              return (
                <button
                  key={option.value}
                  ref={isSelected ? selectedOptionRef : null}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-primary hover:text-white transition-colors duration-150 ${
                    isSelected 
                      ? "bg-primary text-white font-semibold" 
                      : "text-gray-700"
                  }`}
                >
                  {option.label || option.value}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DatePickerInput({
  label,
  icon = "mdi:calendar",
  error,
  helperText,
  disabled,
  placeholder = " ",
  value = null,
  onChange,
  clearError,
  loading = false,
  id,
  minDate = null,
  maxDate = null,
}) {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );
  const [isOpen, setIsOpen] = useState(false);

  const inputId = id || `datepicker-${Math.random().toString(36).substring(2)}`;
  const wrapperRef = useRef(null);

  // floating-ui hook
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    setSelectedDate(value ? new Date(value) : null);
  }, [value]);

  // ✅ Disable invalid dates
  const isDateDisabled = (date) => {
    if (minDate && date < new Date(minDate).setHours(0, 0, 0, 0)) return true;
    if (maxDate && date > new Date(maxDate).setHours(23, 59, 59, 999))
      return true;
    return false;
  };

  const handleSelect = (date) => {
    if (!date || disabled || loading) return;
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    onChange?.(date.toISOString());
    clearError?.();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearDate = () => {
    if (disabled || loading) return;
    setSelectedDate("");
    onChange?.("");
  };

  return (
    <div ref={wrapperRef} className="w-full relative group">
      <div
        ref={refs.setReference}
        className={`relative border-b ${
          error ? "border-red-500" : "border-gray-dark"
        } focus-within:border-primary transition-all min-h-[28px] py-0.5 flex items-center ${
          disabled || loading ? "opacity-70" : ""
        }`}
        onClick={() => !disabled && !loading && setIsOpen(true)}
      >
        <div className={`flex-1 ${icon ? "pr-10" : "pr-2"}`}>
          <input
            type="text"
            value={selectedDate ? format(selectedDate, "PPP") : ""}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            readOnly
            disabled={disabled || loading}
            className={`text-sm focus:outline-none bg-transparent w-full placeholder:text-gray-dark ${
              disabled || loading ? "cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* Clear Icon */}
        {!loading && selectedDate && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            className="absolute right-8 text-gray-400 hover:text-red-500"
          >
            <Icon icon="mdi:close-circle" className="h-4 w-4" />
          </button>
        )}

        {/* Chevron Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {icon && (
            <Icon
              icon={icon}
              className={`h-5 w-5 ${
                error ? "text-red-500" : "text-gray-400"
              } group-focus-within:text-primary`}
            />
          )}
        </div>

        {/* Label */}
        <label
          htmlFor={inputId}
          className={`text-sm absolute left-0 text-gray-light truncate max-w-[calc(100%-18px)] float-labels
            ${error ? "text-red-500" : "peer-focus:text-primary"}
            ${selectedDate || isOpen ? "text-xs -top-3 left-0" : ""}
            ${disabled || loading ? "cursor-not-allowed" : ""}`}
        >
          {label}
        </label>
      </div>

      {/* Calendar dropdown */}
      {isOpen && !disabled && !loading && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-20 bg-white shadow-lg rounded-md p-2"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            navLayout="around"
            showOutsideDays
            captionLayout="dropdown"
            startMonth={getPreviousYears()}
            endMonth={getNextYears()}
            components={{
              MonthsDropdown: CustomCaption,
              YearsDropdown: CustomCaption,
            }}
            classNames={{
              today: "text-primary font-semibold",
              selected: "bg-primary text-white rounded-md",
              day: "hover:bg-primary hover:text-white transition-colors",
              chevron: "fill-primary stroke-primary w-5 h-5",
              disabled: "text-gray-300 cursor-not-allowed line-through",
            }}
          />
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
