"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X, Check, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function DropdownFilter({
  label,
  options = [],
  value,
  onChange,
  multiSelect = false,
  isLoading = false, // 🔹 new prop
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const dropdownRef = useRef(null);

  // Ensure correct initial value type
  const selectedValues = multiSelect
    ? Array.isArray(value)
      ? value
      : []
    : value || null;

  // Filtered options
  const filteredOptions = (options?.length>0) && options?.filter((opt) =>
    opt?.label.toLowerCase().includes(search.toLowerCase())
  );

  // Outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIndex >= 0) handleSelect(filteredOptions[highlightIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    },
    [filteredOptions, highlightIndex, isOpen, isLoading]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (opt) => {
    if (isLoading) return;
    if (multiSelect) {
      const exists = selectedValues.some((item) => item.value === opt.value);
      if (exists) {
        onChange(selectedValues.filter((item) => item.value !== opt.value));
      } else {
        onChange([...selectedValues, opt]);
      }
    } else {
      onChange(opt);
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (isLoading) return;
    onChange(multiSelect ? [] : null);
  };

  const renderButtonLabel = () => {
    if (isLoading) return "Loading..."; // 🔹 show loading label
    if (multiSelect) {
      return selectedValues.length > 0
        ? `${selectedValues.length} selected`
        : label;
    } else {
      return selectedValues ? selectedValues.label : label;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen((prev) => !prev)}
        disabled={isLoading}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md justify-between",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {renderButtonLabel()}

        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <>
            {(multiSelect ? selectedValues.length > 0 : !!selectedValues) && (
              <X
                className="w-4 h-4 text-gray-500 hover:text-red-500"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !isLoading && (
        <div className="absolute mt-1 bg-white border rounded-md shadow-lg w-56 z-50">
          {/* Search */}
          <div className="px-3">
            <div className="flex items-center py-2 border-b border-primary/30">
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 text-sm outline-none"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightIndex(0);
                }}
                autoFocus
              />
              <Search className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-40 overflow-y-auto" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = multiSelect
                  ? selectedValues.some((item) => item.value === opt.value)
                  : selectedValues?.value === opt.value;

                return (
                  <li
                    key={opt.value}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                      isSelected && "bg-blue-500 text-white",
                      highlightIndex === idx && !isSelected && "bg-blue-100"
                    )}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {multiSelect && (
                      <span
                        className={clsx(
                          "w-4 h-4 border rounded flex items-center justify-center",
                          isSelected
                            ? "bg-blue-500 border-gray-300 text-white"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && <Check size={14} />}
                      </span>
                    )}
                    {opt.label}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
