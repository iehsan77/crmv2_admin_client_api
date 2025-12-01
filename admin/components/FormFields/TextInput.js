"use client";
import { Icon } from "@iconify/react";
import { useState, useEffect, useId, useRef } from "react";

export default function TextInput({
  label,
  type = "text",
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  maxLength,
  id,
  is_required,
  value,
  dir = "ltr", // "ltr" or "rtl"
  // New validation props
  allowedPattern = ".*", // Default: allow everything
  blockedPattern = "", // Block specific patterns
  allowedSymbols = undefined, // Specific symbols to allow
  blockedSymbols = "", // Specific symbols to block
  allowNumbers = true, // Allow numbers by default
  allowLetters = true, // Allow letters by default
  customValidator, // Custom validation function
  onValidationError, // Callback for validation errors
  ...props
}) {
  const inputId = id || useId();
  const [charCount, setCharCount] = useState(value?.length || 0);
  const [internalValue, setInternalValue] = useState(value || "");
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setCharCount(value?.length || 0);
    setInternalValue(value || "");
  }, [value]);

  // Function to validate input
const validateInput = (inputValue) => {
  if (!inputValue) {
    setValidationError("");
    return true;
  }

  let isValid = true;
  let errorMessage = "";

  const noRestrictions =
    !customValidator &&
    !blockedSymbols &&
    allowedSymbols === undefined &&
    (!blockedPattern || blockedPattern.trim() === "") &&
    (allowedPattern === ".*" || !allowedPattern) &&
    allowLetters &&
    allowNumbers;


  // ✅ Agar koi restriction hi nahi, to directly return true
  if (noRestrictions) {
    setValidationError("");
    return true;
  }

  // 🧩 custom validator
  if (customValidator) {
    const customResult = customValidator(inputValue);
    if (typeof customResult === "string") {
      isValid = false;
      errorMessage = customResult;
    } else if (customResult === false) {
      isValid = false;
      errorMessage = "Invalid input";
    }
  }

  if (type === "text") {
    // 🚫 Blocked symbols
    if (isValid && blockedSymbols) {
      const blockedRegex = new RegExp(
        `[${blockedSymbols.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`
      );
      if (blockedRegex.test(inputValue)) {
        isValid = false;
        errorMessage = `These symbols are not allowed: ${blockedSymbols}`;
      }
    }

    // ✅ Allowed symbols, letters, numbers
    if (isValid && (allowLetters || allowNumbers || allowedSymbols)) {
      const allowedChars = [];
      const allowedParts = [];

      if (allowLetters) {
        // allowedChars.push("a-zA-Z");
        allowedChars.push("a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F");
        allowedParts.push("letters");
      }
      if (allowNumbers) {
        allowedChars.push("0-9");
        allowedParts.push("numbers");
      }
      if (allowedSymbols) {
        const escapedSymbols = allowedSymbols.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        allowedChars.push(escapedSymbols);
        allowedParts.push(`symbols: ${allowedSymbols}`);
      }

      const allowedRegex = new RegExp(`^[${allowedChars.join("")}]*$`);
      if (!allowedRegex.test(inputValue)) {
        isValid = false;
        if (allowedParts.length === 1) {
          errorMessage = `Only ${allowedParts[0]} are allowed.`;
        } else if (allowedParts.length === 2) {
          errorMessage = `Only ${allowedParts[0]} and ${allowedParts[1]} are allowed.`;
        } else {
          const last = allowedParts.pop();
          errorMessage = `Only ${allowedParts.join(", ")} and ${last} are allowed.`;
        }
      }
    }

    // 🚫 Blocked pattern
    if (isValid && blockedPattern) {
      const blockedRegex = new RegExp(blockedPattern);
      if (blockedRegex.test(inputValue)) {
        isValid = false;
        errorMessage = "Input contains invalid pattern";
      }
    }

    // ✅ Allowed pattern
    if (isValid && allowedPattern && allowedPattern !== ".*") {
      const allowedRegex = new RegExp(allowedPattern);
      if (!allowedRegex.test(inputValue)) {
        isValid = false;
        errorMessage = "Input format is not allowed";
      }
    }

    // ⚙️ Basic number/letter restriction
    if (isValid) {
      if (!allowNumbers && /\d/.test(inputValue)) {
        isValid = false;
        errorMessage = "Numbers are not allowed";
      }
      if (!allowLetters && /[a-zA-Z]/.test(inputValue)) {
        isValid = false;
        errorMessage = "Letters are not allowed";
      }
    }
  }

  setValidationError(errorMessage);
  if (onValidationError && !isValid) {
    onValidationError(errorMessage);
  }

  return isValid;
};


  // Handle input change with validation
  const handleInputChange = (e) => {
    const newValue = e.target.value;

    // Validate the new input
    const isValid = validateInput(newValue);

    // Only update if valid or if empty
    if (isValid || newValue === "") {
      setInternalValue(newValue);
      setCharCount(newValue.length);

      // Call original onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
    } else {
      // Prevent the invalid input
      e.preventDefault();
      // Keep the current value but show error
      if (inputRef.current) {
        inputRef.current.value = internalValue;
      }
    }
  };

  const isRTL = dir === "rtl";
  const displayError = error || validationError;

  return (
    <div className={`w-full relative group`} dir={dir}>
      {/* Input Container */}
      <div
        className={`relative border-b ${
          displayError ? "border-red-500" : "border-gray-dark"
        } ${
          disabled ? "opacity-70" : ""
        } focus-within:border-primary transition-all`}
      >
        {/* Icon */}
        {icon && (
          <div
            className={`absolute inset-y-0 flex items-center pointer-events-none ${
              isRTL ? "right-0 pr-2" : "left-0 pl-2"
            }`}
          >
            <Icon
              icon={icon}
              className={`h-5 w-5 ${
                displayError ? "text-red-500" : "text-gray-400"
              } group-focus-within:text-primary`}
            />
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          ref={inputRef}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          //maxLength={maxLength || 20}
          {...(maxLength ? { maxLength } : {})}
          className={`text-gray-dark w-full py-1 text-sm focus:outline-none peer ${
            icon
              ? isRTL
                ? "pr-10 text-right"
                : "pl-10 text-left"
              : isRTL
              ? "text-right"
              : "text-left"
          } ${disabled ? "cursor-not-allowed" : ""}`}
          value={internalValue}
          {...props}
          onChange={handleInputChange}
        />

        {/* Label */}
        <label
          htmlFor={inputId}
          className={`text-sm absolute text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
            icon
              ? isRTL
                ? "right-10"
                : "left-10"
              : isRTL
              ? "right-0"
              : "left-0"
          } ${
            displayError ? "text-red-500" : "peer-focus:text-primary"
          } peer-placeholder-shown:text-sm peer-placeholder-shown:top-1 peer-focus:text-xs ${
            isRTL ? "peer-focus:right-0" : "peer-focus:left-0"
          } peer-focus:-top-3 -top-3 text-xs`}
        >
          {label} {is_required && <span className="text-red-500">*</span>}
        </label>

        {/* Tooltip */}
        {tooltip && (
          <div
            className={`absolute inset-y-0 flex items-center ${
              isRTL ? "left-2" : "right-2"
            }`}
          >
            <div className="relative group/tooltip">
              <Icon
                icon={"mdi:information"}
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              <div
                className={`absolute bottom-full mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block ${
                  isRTL ? "left-0" : "right-0"
                }`}
              >
                {tooltip}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Helper + Counter */}
      <div
        className={`flex items-center justify-between ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        {helperText && !displayError && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}
        {displayError && (
          <div className="text-[10px] text-red-500 mt-1">{displayError}</div>
        )}
        {maxLength && (
          <div
            className={`text-xs text-gray-400 mt-1 ${
              isRTL ? "mr-auto" : "ml-auto"
            }`}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}
