"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";

// Component ka naam YearPickerInput kar diya hai
export default function YearPickerInput({
  label,
  icon = "mdi:calendar",
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  value = null, // value ab ek number hoga (e.g., 2025)
  onChange,
  loading = false,
  clearError,
  id,
  startYear = 1980,
  endYear = 9999,
  columns = 3,
  yearBlockSize = 12,
  // FIX: Naye props past/future years disable karne ke liye
  disablePastYears = false,
  disableFutureYears = false,
}) {
  // State ab selectedYear hai (number)
  const [selectedYear, setSelectedYear] = useState(value || null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    new Date(value || new Date().getFullYear(), 1, 1)
  );

  const inputId = id || `yearpicker-${Math.random().toString(36).substring(2)}`;
  const wrapperRef = useRef(null);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    setSelectedYear(value || null);
  }, [value]);
  
  // handleSelect ab sirf 'year' (number) lega
  const handleSelect = (year) => {
    if (disabled || loading) return;
    
    // Check agar saal disable hai to select na ho
    const today = new Date().getFullYear();
    let isDisabled = year < startYear || year > endYear;
    if (disablePastYears && year < today) isDisabled = true;
    if (disableFutureYears && year > today) isDisabled = true;
    if (isDisabled) return;

    setSelectedYear(year);
    onChange?.(year);
    if (clearError) clearError();
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

  // clearDate ka naam clearYear kar diya
  const clearYear = () => {
    if (disabled || loading) return;
    setSelectedYear(null);
    onChange?.(null);
  };

  const visibleYears = useMemo(() => {
    const year = viewDate.getFullYear();
    const blockStart =
      Math.floor((year - startYear) / yearBlockSize) * yearBlockSize +
      startYear;
    return Array.from({ length: yearBlockSize }, (_, i) => blockStart + i);
  }, [viewDate, startYear, yearBlockSize]);

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
            // FIX: Input me ab sirf saal show hoga
            value={selectedYear || ""}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            readOnly
            disabled={disabled || loading}
            className={`text-sm focus:outline-none bg-transparent w-full placeholder:text-gray-dark ${
              disabled || loading ? "cursor-not-allowed" : ""
            }`}
          />
        </div>

        {!loading && selectedYear && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearYear();
            }}
            className="absolute right-8 text-gray-400 hover:text-red-500"
          >
            <Icon icon="mdi:close-circle" className="h-4 w-4" />
          </button>
        )}

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

        <label
          className={`text-sm absolute left-0 text-gray-light truncate max-w-[calc(100%-18px)] float-labels ${
            error ? "text-red-500" : "peer-focus:text-primary"
          } ${
            selectedYear || isOpen
              ? "text-xs -top-3 left-0"
              : "peer-placeholder-shown:text-sm peer-placeholder-shown:top-0 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3"
          } ${disabled || loading ? "cursor-not-allowed" : ""}`}
        >
          {label}
        </label>

        {tooltip && (
            <div className="absolute inset-y-0 right-2 flex items-center">
                {/* Aapka original tooltip code */}
            </div>
        )}
      </div>

      {isOpen && !disabled && !loading && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 w-64 bg-white shadow-lg rounded-md p-2"
        >
            <div className="flex items-center justify-between pb-2 px-1">
              <button
                type="button"
                onClick={() => setViewDate(prev => new Date(prev.getFullYear() - yearBlockSize, 1, 1))}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Icon icon="mdi:chevron-left" className="h-5 w-5" />
              </button>
              <div className="font-semibold text-sm text-gray-700">
                {visibleYears[0]} - {visibleYears[visibleYears.length - 1]}
              </div>
              <button
                type="button"
                onClick={() => setViewDate(prev => new Date(prev.getFullYear() + yearBlockSize, 1, 1))}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Icon icon="mdi:chevron-right" className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {visibleYears.map((year) => {
                const today = new Date().getFullYear();
                
                // Disabling logic
                let isDisabled = year < startYear || year > endYear;
                if (disablePastYears && year < today) isDisabled = true;
                if (disableFutureYears && year > today) isDisabled = true;
                
                const isSelected = selectedYear === year;
                const isCurrentYear = year === today;

                return (
                  <button
                    key={year}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(year)}
                    className={`p-1.5 text-center text-sm rounded transition-colors
                      ${ isSelected ? "bg-blue-500 text-white font-semibold" : "" }
                      ${ !isSelected && !isDisabled ? "hover:bg-blue-100" : "" }
                      ${ isDisabled ? "text-gray-300 cursor-not-allowed" : "text-gray-800" }
                      ${
                        // FIX: Current year par border
                        isCurrentYear && !isSelected && !isDisabled ? "border border-blue-500" : ""
                      }
                    `}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
            {/* FIX: Current Year ka button */}
            <div className="pt-2 mt-2 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => handleSelect(new Date().getFullYear())}
                    className="w-full text-sm text-center py-1.5 px-3 rounded text-[#1E3A8A] font-semibold hover:bg-blue-100"
                >
                    Current Year
                </button>
            </div>
        </div>
      )}

      {helperText && !error && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}
      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}
