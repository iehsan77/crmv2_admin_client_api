"use client";
import { Icon } from "@iconify/react";
import { useState, useEffect, useId, useRef } from "react";

const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    format: "us",
    maxLength: 10,
    pattern: /^\+1\d{10}$/,
    example: "+1 (234) 567-8900",
  },
  {
    code: "PK",
    name: "Pakistan",
    dialCode: "+92",
    flag: "🇵🇰",
    format: "pakistan",
    maxLength: 10,
    pattern: /^\+92\d{10}$/,
    example: "+92 300 1234567",
  },
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    flag: "🇮🇳",
    format: "international",
    maxLength: 10,
    pattern: /^\+91\d{10}$/,
    example: "+91 98765 43210",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    format: "international",
    maxLength: 10,
    pattern: /^\+44\d{10}$/,
    example: "+44 7911 123456",
  },
  {
    code: "AE",
    name: "UAE",
    dialCode: "+971",
    flag: "🇦🇪",
    format: "international",
    maxLength: 9,
    pattern: /^\+971\d{9}$/,
    example: "+971 50 123 4567",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    flag: "🇸🇦",
    format: "international",
    maxLength: 9,
    pattern: /^\+966\d{9}$/,
    example: "+966 55 123 4567",
  },
];

export default function PhoneInput({
  label = "Phone Number",
  value,
  defaultValue,
  onChange,
  onCountryChange,
  required = false,
  disabled = false,
  error,
  helperText,
  placeholder,
  defaultCountry = "PK",
  allowedCountries = [],
  showCountryDropdown = true,
  validateOnChange = false,
  customValidator,
  className = "",
  ...props
}) {
  const inputId = useId();
  const [phoneValue, setPhoneValue] = useState(value || defaultValue || "");
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState("");
  const dropdownRef = useRef(null);

  const availableCountries =
    allowedCountries.length > 0
      ? COUNTRIES.filter((c) => allowedCountries.includes(c.code))
      : COUNTRIES;

  // --- FORMATTER ---
  // --- FORMATTER ---
  const formatPhoneNumber = (digits, country) => {
    if (!digits) return "";
    const cleaned = digits.replace(/\D/g, "").slice(0, country.maxLength);

    // country-specific formatting rules
    switch (country.code) {
      case "US": // +1 (234) 567-8900
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
          6
        )}`;

      case "PK": // +92 300 1234567
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
          6
        )}`;

      case "IN": // +91 98765 43210
        if (cleaned.length <= 5) return cleaned;
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;

      case "GB": // +44 7911 123456
        if (cleaned.length <= 4) return cleaned;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;

      case "AE": // +971 50 123 4567  => 2 + 3 + 4 pattern
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 5)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(
          5
        )}`;

      case "SA": // +966 55 123 4567  => 2 + 3 + 4 pattern
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 5)
          return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}`;
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(
          5
        )}`;

      default: // fallback for any other country
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6)
          return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
          6
        )}`;
    }
  };

  const getFullInternationalNumber = (digits, country) =>
    country.dialCode + digits.replace(/\D/g, "").slice(0, country.maxLength);

  const getFormattedValueWithCode = (digits, country) =>
    `${country.dialCode} ${formatPhoneNumber(digits, country)}`;

  // --- VALIDATION ---
  const validatePhone = (digits, country) => {
    const full = getFullInternationalNumber(digits, country);
    let err = "";

    if (customValidator) {
      const result = customValidator(full, country);
      if (typeof result === "string") err = result;
      else if (result === false) err = "Invalid phone number";
    }

    if (!err && country.pattern && !country.pattern.test(full)) {
      err = `Please enter a valid ${country.name} number`;
    }

    setValidationError(err);
    return !err;
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = formatPhoneNumber(raw, selectedCountry);
    setPhoneValue(formatted);

    const isValid = !validateOnChange || validatePhone(raw, selectedCountry);
    const event = {
      ...e,
      target: {
        ...e.target,
        value: getFormattedValueWithCode(raw, selectedCountry),
        phoneData: {
          number: formatted,
          fullNumber: getFullInternationalNumber(raw, selectedCountry),
          formattedNumber: getFormattedValueWithCode(raw, selectedCountry),
          rawDigits: raw,
          country: selectedCountry,
          isValid,
        },
      },
    };
    onChange?.(event);
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    if (phoneValue) {
      const raw = phoneValue.replace(/\D/g, "");
      setPhoneValue(formatPhoneNumber(raw, country));
      validatePhone(raw, country);
    }
    onCountryChange?.(country);
  };

  // --- OUTSIDE CLICK ---
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // --- EXTERNAL VALUE SYNC ---
  useEffect(() => {
    if (value !== undefined && value !== phoneValue) {
      const cleaned = value.replace(/\D/g, "");
      setPhoneValue(formatPhoneNumber(cleaned, selectedCountry));
    }
  }, [value, selectedCountry]);

  const displayError = error || validationError;
  const defaultPlaceholder =
    selectedCountry.example?.split(" ").slice(1).join(" ") || "Phone number";

  return (
    <div className={`w-full relative ${className}`}>
      <label
        htmlFor={inputId}
        className="absolute -top-3 left-0 block text-xs mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative flex border-b border-gray-300 transition-colors">
        {showCountryDropdown && (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-3 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50"
            >
              <span className="text-lg mr-2">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">
                {selectedCountry.dialCode}
              </span>
              <Icon
                icon={isDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="h-4 w-4 ml-1 text-gray-500"
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {availableCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c)}
                    className={`flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                      selectedCountry.code === c.code
                        ? "bg-blue-50 text-blue-600"
                        : ""
                    }`}
                  >
                    <span className="text-lg mr-3">{c.flag}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {c.dialCode} • {c.example}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 relative">
          {!showCountryDropdown && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              {selectedCountry.dialCode}
            </div>
          )}
          <input
            id={inputId}
            type="tel"
            value={phoneValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder || defaultPlaceholder}
            className={`text-sm w-full ${
              showCountryDropdown ? "pl-3" : "pl-16"
            } pr-3 focus:outline-none bg-transparent placeholder-gray-400 ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
            {...props}
          />
        </div>
      </div>

      {helperText && !displayError && (
        <div className="mt-1 min-h-[20px] text-xs text-gray-500 flex items-center">
          <Icon icon="mdi:information-outline" className="h-3 w-3 mr-1" />
          {helperText}
        </div>
      )}
      {displayError && (
        <div className="mt-1 min-h-[20px] text-xs text-red-600 flex items-center">
          <Icon icon="mdi:alert-circle-outline" className="h-3 w-3 mr-1" />
          {displayError}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1 flex items-center">
        <Icon icon="mdi:earth" className="h-3 w-3 mr-1" />
        {selectedCountry.name} • Format: {selectedCountry.example}
      </div>
    </div>
  );
}

// "use client";
// import { Icon } from "@iconify/react";
// import { useState, useEffect, useId, useRef } from "react";

// // Country data with flags and formats
// const COUNTRIES = [
//   {
//     code: "US",
//     name: "United States",
//     dialCode: "+1",
//     flag: "🇺🇸",
//     format: "us",
//     pattern: /^\+1\d{10}$/,
//     example: "+1 (234) 567-8900",
//   },
//   {
//     code: "PK",
//     name: "Pakistan",
//     dialCode: "+92",
//     flag: "🇵🇰",
//     format: "pakistan",
//     pattern: /^\+92\d{10}$/,
//     example: "+92 300 1234567",
//   },
//   {
//     code: "IN",
//     name: "India",
//     dialCode: "+91",
//     flag: "🇮🇳",
//     format: "international",
//     pattern: /^\+91\d{10}$/,
//     example: "+91 98765 43210",
//   },
//   {
//     code: "GB",
//     name: "United Kingdom",
//     dialCode: "+44",
//     flag: "🇬🇧",
//     format: "international",
//     pattern: /^\+44\d{10}$/,
//     example: "+44 7911 123456",
//   },
//   {
//     code: "AE",
//     name: "UAE",
//     dialCode: "+971",
//     flag: "🇦🇪",
//     format: "international",
//     pattern: /^\+971\d{9}$/,
//     example: "+971 50 123 4567",
//   },
//   {
//     code: "SA",
//     name: "Saudi Arabia",
//     dialCode: "+966",
//     flag: "🇸🇦",
//     format: "international",
//     pattern: /^\+966\d{9}$/,
//     example: "+966 55 123 4567",
//   },
// ];

// export default function PhoneInput({
//   label = "Phone Number",
//   value,
//   defaultValue,
//   onChange,
//   onCountryChange,
//   required = false,
//   disabled = false,
//   error,
//   helperText,
//   placeholder,
//   defaultCountry = "PK",
//   allowedCountries = [],
//   showCountryDropdown = true,
//   validateOnChange = true,
//   customValidator,
//   className = "",
//   ...props
// }) {
//   console.log(props, "props in phone input");
//   const inputId = useId();
//   const [phoneValue, setPhoneValue] = useState(value || defaultValue || "");
//   const [selectedCountry, setSelectedCountry] = useState(
//     COUNTRIES.find((country) => country.code === defaultCountry) || COUNTRIES[0]
//   );
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [validationError, setValidationError] = useState("");
//   // const inputRef = useRef(null);
//   const dropdownRef = useRef(null);

//   // Filter countries if allowedCountries is specified
//   const availableCountries =
//     allowedCountries.length > 0
//       ? COUNTRIES.filter((country) => allowedCountries.includes(country.code))
//       : COUNTRIES;

//   // Format phone number based on country (returns formatted display value)
//   const formatPhoneNumber = (phone, country) => {
//     const cleaned = phone.replace(/\D/g, "");

//     if (!cleaned) return "";

//     switch (country.format) {
//       case "us":
//         if (cleaned.length <= 3) return cleaned;
//         if (cleaned.length <= 6)
//           return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
//         return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
//           6,
//           10
//         )}`;

//       case "pakistan":
//         if (cleaned.length <= 4) return cleaned;
//         return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 11)}`;

//       case "international":
//       default:
//         if (cleaned.length <= 3) return cleaned;
//         if (cleaned.length <= 6)
//           return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
//         if (cleaned.length <= 9)
//           return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
//             6
//           )}`;
//         return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
//           6,
//           10
//         )}`;
//     }
//   };

//   // Get formatted value with country code for target.value
//   const getFormattedValueWithCountryCode = (localNumber) => {
//     const cleaned = localNumber.replace(/\D/g, "");
//     const formattedLocal = formatPhoneNumber(cleaned, selectedCountry);
//     return selectedCountry.dialCode + " " + formattedLocal;
//   };

//   // Get full international number (digits only)
//   const getFullInternationalNumber = (localNumber) => {
//     const cleaned = localNumber.replace(/\D/g, "");
//     return selectedCountry.dialCode + cleaned;
//   };

//   // Validate phone number
//   const validatePhoneNumber = (phone) => {
//     if (!phone) {
//       setValidationError("");
//       return true;
//     }

//     const fullNumber = getFullInternationalNumber(phone);
//     let isValid = true;
//     let errorMessage = "";

//     // Check custom validator first
//     if (customValidator) {
//       const customResult = customValidator(fullNumber, selectedCountry, phone);
//       if (typeof customResult === "string") {
//         isValid = false;
//         errorMessage = customResult;
//       } else if (customResult === false) {
//         isValid = false;
//         errorMessage = "Invalid phone number";
//       }
//     }

//     // Check country pattern
//     if (isValid && selectedCountry.pattern) {
//       if (!selectedCountry.pattern.test(fullNumber)) {
//         isValid = false;
//         errorMessage = `Please enter a valid ${selectedCountry.name} phone number`;
//       }
//     }

//     // Basic length validation
//     if (isValid) {
//       const cleaned = phone.replace(/\D/g, "");
//       const minLength =
//         selectedCountry.code === "US"
//           ? 10
//           : selectedCountry.code === "AE" || selectedCountry.code === "SA"
//           ? 9
//           : 10;

//       if (cleaned.length < minLength) {
//         isValid = false;
//         errorMessage = `Phone number too short for ${selectedCountry.name}`;
//       } else if (cleaned.length > 15) {
//         isValid = false;
//         errorMessage = "Phone number too long";
//       }
//     }

//     setValidationError(errorMessage);
//     return isValid;
//   };

//   // Handle phone number change with auto-formatting
//   const handlePhoneChange = (e) => {
//     const inputValue = e.target.value;

//     // Remove any existing formatting but keep digits
//     const cleaned = inputValue.replace(/\D/g, "");

//     // Apply formatting based on country
//     const formattedValue = formatPhoneNumber(cleaned, selectedCountry);

//     // Set the formatted value for display
//     setPhoneValue(formattedValue);

//     // Validate
//     let isValid = true;
//     if (validateOnChange) {
//       isValid = validatePhoneNumber(cleaned);
//     }

//     // Prepare the formatted value with country code for props?.onChange
//     const finalFormattedValue = getFormattedValueWithCountryCode(cleaned);
//     const fullInternationalNumber = getFullInternationalNumber(cleaned);

//     // Call props?.onChange with formatted value as target.value
//     if (props?.onChange) {
//       const event = {
//         ...e,
//         target: {
//           ...e.target,
//           value: finalFormattedValue, // Formatted value with country code
//           phoneData: {
//             number: formattedValue, // Local formatted number
//             fullNumber: fullInternationalNumber, // Full international number (digits only)
//             formattedNumber: finalFormattedValue, // Fully formatted number with country code
//             country: selectedCountry,
//             isValid: isValid,
//             rawDigits: cleaned, // Just the digits
//           },
//         },
//       };
//       props?.onChange(event);
//     }
//   };

//   // Handle country change
//   const handleCountryChange = (country) => {
//     setSelectedCountry(country);
//     setIsDropdownOpen(false);

//     // Reformat existing number with new country
//     if (phoneValue) {
//       const cleaned = phoneValue.replace(/\D/g, "");
//       const formattedValue = formatPhoneNumber(cleaned, country);
//       setPhoneValue(formattedValue);

//       // Trigger props?.onChange with new formatted value
//       if (props?.onChange) {
//         const finalFormattedValue = getFormattedValueWithCountryCode(cleaned);
//         const fullInternationalNumber = getFullInternationalNumber(cleaned);
//         const isValid = validatePhoneNumber(cleaned);

//         const event = {
//           target: {
//             value: finalFormattedValue,
//             phoneData: {
//               number: formattedValue,
//               fullNumber: fullInternationalNumber,
//               formattedNumber: finalFormattedValue,
//               country: country,
//               isValid: isValid,
//               rawDigits: cleaned,
//             },
//           },
//         };
//         props?.onChange(event);
//       }
//     }

//     if (onCountryChange) {
//       onCountryChange(country);
//     }
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Update when external value changes
//   useEffect(() => {
//     if (value !== undefined) {
//       const cleaned = value.replace(/\D/g, "");
//       const formattedValue = formatPhoneNumber(cleaned, selectedCountry);
//       setPhoneValue(formattedValue);
//     }
//   }, [value, selectedCountry]);

//   const displayError = error || validationError;
//   const defaultPlaceholder = selectedCountry.example
//     ? selectedCountry.example.split(" ").slice(1).join(" ")
//     : "Phone number";

//   return (
//     <div className={`w-full relative ${className}`}>
//       <label
//         htmlFor={inputId}
//         className="absolute -top-3 left-0 block text-xs mb-1"
//       >
//         {label} {required && <span className="text-red-500">*</span>}
//       </label>

//       <div className="relative flex border-b border-gray-300 transition-colors">
//         {/* Country Dropdown */}
//         {showCountryDropdown && (
//           <div ref={dropdownRef} className="relative">
//             <button
//               type="button"
//               disabled={disabled}
//               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//               className="flex items-center px-3 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <span className="text-lg mr-2">{selectedCountry.flag}</span>
//               <span className="text-sm font-medium">
//                 {selectedCountry.dialCode}
//               </span>
//               <Icon
//                 icon={isDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
//                 className="h-4 w-4 ml-1 text-gray-500"
//               />
//             </button>

//             {isDropdownOpen && (
//               <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
//                 {availableCountries.map((country) => (
//                   <button
//                     key={country.code}
//                     type="button"
//                     onClick={() => handleCountryChange(country)}
//                     className={`flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
//                       selectedCountry.code === country.code
//                         ? "bg-blue-50 text-blue-600"
//                         : ""
//                     }`}
//                   >
//                     <span className="text-lg mr-3">{country.flag}</span>
//                     <div className="flex-1">
//                       <div className="text-sm font-medium">{country.name}</div>
//                       <div className="text-xs text-gray-500">
//                         {country.dialCode} • {country.example}
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Phone Input */}
//         <div className="flex-1 relative">
//           {!showCountryDropdown && (
//             <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
//               {selectedCountry.dialCode}
//             </div>
//           )}
//           <input
//             id={inputId}
//             // ref={inputRef}
//             type="tel"
//             value={phoneValue}
//             disabled={disabled}
//             placeholder={placeholder || defaultPlaceholder}
//             className={`text-sm w-full ${
//               showCountryDropdown ? "pl-3" : "pl-16"
//             } pr-3 focus:outline-none bg-transparent placeholder-gray-400 ${
//               disabled ? "cursor-not-allowed opacity-50" : ""
//             }`}
//             {...props}
//             onChange={handlePhoneChange}
//           />
//         </div>
//       </div>

//       {/* Helper Text and Error */}
//       {helperText && !displayError && (
//         <div className="mt-1 min-h-[20px]">
//           <div className="text-xs text-gray-500 flex items-center">
//             <Icon icon="mdi:information-outline" className="h-3 w-3 mr-1" />
//             {helperText}
//           </div>
//         </div>
//       )}
//       {displayError && (
//         <div className="mt-1 min-h-[20px]">
//           <div className="text-xs text-red-600 flex items-center">
//             <Icon icon="mdi:alert-circle-outline" className="h-3 w-3 mr-1" />
//             {displayError}
//           </div>
//         </div>
//       )}

//       {/* Country Info */}
//       <div className="text-xs text-gray-400 mt-1 flex items-center">
//         <Icon icon="mdi:earth" className="h-3 w-3 mr-1" />
//         {selectedCountry.name} • Format: {selectedCountry.example}
//       </div>
//     </div>
//   );
// }
