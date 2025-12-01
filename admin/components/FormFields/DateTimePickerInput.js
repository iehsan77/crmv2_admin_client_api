"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
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
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year - 100, month);
}

// Next 100 years range
function getNextYears() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year + 100, month);
}

export default function DateTimePickerInput({
  label,
  icon = "mdi:calendar-clock",
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  value = null,
  onChange,
  loading = false,
  id,
  name,
  clearError,
  minDateTime = null, // ✅ New prop: minimum allowed datetime
  maxDateTime = null, // ✅ New prop: maximum allowed datetime
  excludeDates = [], // ✅ New prop: dates to disable
}) {
  const [selectedDateTime, setSelectedDateTime] = useState(
    value ? parseISO(value) : null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState({
    hours: "12",
    minutes: "00",
    period: "AM",
  });
  const [timeError, setTimeError] = useState("");

  const inputId =
    id || `datetimepicker-${Math.random().toString(36).substring(2)}`;
  const wrapperRef = useRef(null);

  // floating-ui hook
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (value) {
      const date = parseISO(value);
      setSelectedDateTime(date);
      if (date) {
        const hours = date.getHours();
        setTime({
          hours: hours % 12 === 0 ? "12" : String(hours % 12).padStart(2, "0"),
          minutes: String(date.getMinutes()).padStart(2, "0"),
          period: hours >= 12 ? "PM" : "AM",
        });
      }
    } else {
      setSelectedDateTime(null);
      setTime({ hours: "12", minutes: "00", period: "AM" });
    }
  }, [value]);

  // ✅ Validation function
  const validateDateTime = (dateTime) => {
    if (!dateTime) return "";

    const errors = [];

    if (minDateTime && dateTime < new Date(minDateTime)) {
      errors.push(`Must be after ${format(new Date(minDateTime), "PPP p")}`);
    }

    if (maxDateTime && dateTime > new Date(maxDateTime)) {
      errors.push(`Must be before ${format(new Date(maxDateTime), "PPP p")}`);
    }

    return errors.join("; ");
  };

  // ✅ Check if a date should be disabled
  const isDateDisabled = (date) => {
    // Exclude specific dates
    if (excludeDates.some(excludedDate => 
      format(date, 'yyyy-MM-dd') === format(new Date(excludedDate), 'yyyy-MM-dd')
    )) {
      return true;
    }

    // Disable dates before minDateTime
    if (minDateTime && date < new Date(minDateTime).setHours(0, 0, 0, 0)) {
      return true;
    }

    // Disable dates after maxDateTime
    if (maxDateTime && date > new Date(maxDateTime).setHours(23, 59, 59, 999)) {
      return true;
    }

    return false;
  };

  const handleDateSelect = (date) => {
    if (!date || disabled || loading) return;

    // ✅ Check if selected date is disabled
    if (isDateDisabled(date)) {
      return;
    }

    // Combine selected date with current time
    const newDateTime = new Date(date);
    const hours =
      time.period === "PM"
        ? (parseInt(time.hours, 10) % 12) + 12
        : parseInt(time.hours, 10) % 12;

    newDateTime.setHours(hours);
    newDateTime.setMinutes(parseInt(time.minutes, 10));

    // ✅ Validate the combined datetime
    const validationError = validateDateTime(newDateTime);
    if (validationError) {
      setTimeError(validationError);
    } else {
      setTimeError("");
    }

    setSelectedDateTime(newDateTime);
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    if (disabled || loading) return;

    let newValue = value;
    if (value === "") {
      newValue = "00";
    } else if (value.length === 1) {
      newValue = `0${value}`;
    } else if (value.length > 2) {
      newValue = value.slice(0, 2);
    }

    // Validate ranges
    if (name === "hours" && parseInt(newValue, 10) > 12) {
      newValue = "12";
    } else if (name === "minutes" && parseInt(newValue, 10) > 59) {
      newValue = "59";
    }

    setTime((prev) => ({ ...prev, [name]: newValue }));

    // ✅ Revalidate when time changes
    if (selectedDateTime) {
      const newDateTime = new Date(selectedDateTime);
      const hours =
        name === "hours" ? 
          (parseInt(newValue, 10) % 12) + (time.period === "PM" ? 12 : 0)
          : (parseInt(time.hours, 10) % 12) + (time.period === "PM" ? 12 : 0);
      
      const minutes = name === "minutes" ? parseInt(newValue, 10) : parseInt(time.minutes, 10);

      newDateTime.setHours(hours);
      newDateTime.setMinutes(minutes);

      const validationError = validateDateTime(newDateTime);
      setTimeError(validationError);
    }
  };

  const handlePeriodChange = (e) => {
    if (disabled || loading) return;
    setTime((prev) => ({ ...prev, period: e.target.value }));

    // ✅ Revalidate when period changes
    if (selectedDateTime) {
      const newDateTime = new Date(selectedDateTime);
      const hours =
        e.target.value === "PM"
          ? (parseInt(time.hours, 10) % 12) + 12
          : parseInt(time.hours, 10) % 12;

      newDateTime.setHours(hours);
      newDateTime.setMinutes(parseInt(time.minutes, 10));

      const validationError = validateDateTime(newDateTime);
      setTimeError(validationError);
    }
  };

  const handleCompleteSelection = () => {
    if (!selectedDateTime || disabled || loading) return;

    // ✅ Final validation before applying
    const finalDateTime = new Date(selectedDateTime);
    const hours =
      time.period === "PM"
        ? (parseInt(time.hours, 10) % 12) + 12
        : parseInt(time.hours, 10) % 12;

    finalDateTime.setHours(hours);
    finalDateTime.setMinutes(parseInt(time.minutes, 10));

    const validationError = validateDateTime(finalDateTime);
    
    if (validationError) {
      setTimeError(validationError);
      return;
    }

    setTimeError("");
    onChange?.(finalDateTime.toISOString());
    clearError?.();
    setIsOpen(false);
  };

  const clearDateTime = (e) => {
    e?.stopPropagation();
    if (disabled || loading) return;
    setSelectedDateTime("");
    setTime({ hours: "12", minutes: "00", period: "AM" });
    setTimeError("");
    onChange?.("");
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

  const displayFormat = "PPP h:mm aa";

  return (
    <div ref={wrapperRef} className="w-full relative group">
      <div
        ref={refs.setReference}
        className={`relative border-b ${
          error || timeError ? "border-red-500" : "border-gray-dark"
        } focus-within:border-primary transition-all min-h-[28px]  min-w-[250px] py-0.5 flex items-center ${
          disabled || loading ? "opacity-70" : ""
        }`}
        onClick={() => !disabled && !loading && setIsOpen(true)}
      >
        <div className={`flex-1 ${icon ? "pr-10" : "pr-2"}`}>
          <input
            type="text"
            name={name}
            value={
              selectedDateTime ? format(selectedDateTime, displayFormat) : ""
            }
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            readOnly
            disabled={disabled || loading}
            className={`text-sm focus:outline-none bg-transparent w-full placeholder:text-gray-dark w-[300px] ${
              disabled || loading ? "cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* Clear Icon */}
        {!loading && selectedDateTime && !disabled && (
          <button
            type="button"
            onClick={clearDateTime}
            className="absolute right-8 text-gray-400 hover:text-red-500"
          >
            <Icon icon="mdi:close-circle" className="h-4 w-4" />
          </button>
        )}

        {/* Chevron Icon */}
        <div
          className={`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none ${
            error || timeError ? "text-red-500" : "text-gray-400"
          }`}
        >
          <Icon icon={icon} className="h-5 w-5" />
        </div>

        {/* Label */}
        <label
          className={`text-sm absolute left-0 text-gray-light truncate max-w-[calc(100%-18px)] float-labels 
            ${error || timeError ? "text-red-500" : "peer-focus:text-primary"} ${
            selectedDateTime || isOpen
              ? "text-xs -top-3 left-0"
              : "peer-placeholder-shown:text-sm peer-placeholder-shown:top-0 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3"
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

      {/* DateTime dropdown */}
      {isOpen && !disabled && !loading && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="absolute z-20 mt-1 w-fit bg-white shadow-lg rounded-md p-4"
        >
          <div className="flex flex-col gap-4">
            {/* Date Picker */}
            <div className="border-b pr-4">
              <DayPicker
                mode="single"
                selected={selectedDateTime}
                onSelect={handleDateSelect}
                disabled={isDateDisabled} // ✅ Use custom disabled function
                navLayout="around"
                showOutsideDays
                captionLayout="dropdown"
                startMonth={getPreviousYears()}
                endMonth={getNextYears()}
                classNames={{
                  today: "text-primary font-semibold",
                  selected: "bg-primary text-white rounded-md",
                  day: "hover:bg-primary hover:text-white transition-colors",
                  chevron: "fill-primary stroke-primary w-5 h-5",
                  disabled: "text-gray-300 cursor-not-allowed line-through",
                }}
                styles={{
                  chevron: { color: "var(--primary)" },
                }}
              />
            </div>

            {/* Time Picker */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Select Time</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name="hours"
                    min="1"
                    max="12"
                    value={time.hours}
                    onChange={handleTimeChange}
                    className="w-16 px-2 py-1 border rounded text-center"
                    placeholder="HH"
                  />
                  <span>:</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name="minutes"
                    min="0"
                    max="59"
                    value={time.minutes}
                    onChange={handleTimeChange}
                    className="w-16 px-2 py-1 border rounded text-center"
                    placeholder="MM"
                  />
                </div>
                <select
                  name="period"
                  value={time.period}
                  onChange={handlePeriodChange}
                  className="w-16 px-2 py-1 border rounded"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              {/* ✅ Validation Error Display */}
              {timeError && (
                <div className="text-red-500 text-xs mt-1">{timeError}</div>
              )}

              <button
                type="button"
                onClick={handleCompleteSelection}
                disabled={!selectedDateTime || timeError}
                className={`mt-2 px-4 py-1 text-sm rounded ${
                  selectedDateTime && !timeError
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helper/Error Text */}
      {helperText && !error && !timeError && (
        <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
      )}
      {(error || timeError) && (
        <div className="text-[10px] text-red-500 mt-1">{error || timeError}</div>
      )}
    </div>
  );
}


// "use client";

// import { Icon } from "@iconify/react";
// import { useState, useEffect, useRef } from "react";
// import { format, parseISO } from "date-fns";
// import { DayPicker } from "react-day-picker";
// import {
//   useFloating,
//   offset,
//   flip,
//   shift,
//   autoUpdate,
// } from "@floating-ui/react";
// import "react-day-picker/dist/style.css";

// // Previous 100 years range
// function getPreviousYears() {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth(); // already 0-based
//   return new Date(year - 100, month);
// }

// // Next 100 years range
// function getNextYears() {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth();
//   return new Date(year + 100, month);
// }

// export default function DateTimePickerInput({
//   label,
//   icon = "mdi:calendar-clock",
//   error,
//   helperText,
//   tooltip,
//   disabled,
//   placeholder = " ",
//   value = null,
//   onChange,
//   loading = false,
//   id,
//   name,
//   clearError,
// }) {
//   const [selectedDateTime, setSelectedDateTime] = useState(
//     value ? parseISO(value) : null
//   );
//   const [isOpen, setIsOpen] = useState(false);
//   const [time, setTime] = useState({
//     hours: "12",
//     minutes: "00",
//     period: "AM",
//   });

//   const inputId =
//     id || `datetimepicker-${Math.random().toString(36).substring(2)}`;
//   const wrapperRef = useRef(null);

//   // floating-ui hook
//   const { refs, floatingStyles } = useFloating({
//     placement: "bottom-start", // default open
//     middleware: [
//       offset(4), // small gap
//       flip(), // flip if no space
//       shift(), // shift into viewport
//     ],
//     whileElementsMounted: autoUpdate,
//   });

//   useEffect(() => {
//     if (value) {
//       const date = parseISO(value);
//       setSelectedDateTime(date);
//       if (date) {
//         const hours = date.getHours();
//         setTime({
//           hours: hours % 12 === 0 ? "12" : String(hours % 12).padStart(2, "0"),
//           minutes: String(date.getMinutes()).padStart(2, "0"),
//           period: hours >= 12 ? "PM" : "AM",
//         });
//       }
//     } else {
//       setSelectedDateTime(null);
//       setTime({ hours: "12", minutes: "00", period: "AM" });
//     }
//   }, [value]);

//   const handleDateSelect = (date) => {
//     if (!date || disabled || loading) return;

//     // Combine selected date with current time
//     const newDateTime = new Date(date);
//     const hours =
//       time.period === "PM"
//         ? (parseInt(time.hours, 10) % 12) + 12
//         : parseInt(time.hours, 10) % 12;

//     newDateTime.setHours(hours);
//     newDateTime.setMinutes(parseInt(time.minutes, 10));

//     setSelectedDateTime(newDateTime);
//   };

//   const handleTimeChange = (e) => {
//     const { name, value } = e.target;
//     if (disabled || loading) return;

//     let newValue = value;
//     if (value === "") {
//       newValue = "00";
//     } else if (value.length === 1) {
//       newValue = `0${value}`;
//     } else if (value.length > 2) {
//       newValue = value.slice(0, 2);
//     }

//     // Validate ranges
//     if (name === "hours" && parseInt(newValue, 10) > 12) {
//       newValue = "12";
//     } else if (name === "minutes" && parseInt(newValue, 10) > 59) {
//       newValue = "59";
//     }

//     setTime((prev) => ({ ...prev, [name]: newValue }));
//   };

//   const handlePeriodChange = (e) => {
//     if (disabled || loading) return;
//     setTime((prev) => ({ ...prev, period: e.target.value }));
//   };

//   const handleCompleteSelection = () => {
//     if (!selectedDateTime || disabled || loading) return;

//     // Create final datetime with selected time
//     const finalDateTime = new Date(selectedDateTime);
//     const hours =
//       time.period === "PM"
//         ? (parseInt(time.hours, 10) % 12) + 12
//         : parseInt(time.hours, 10) % 12;

//     finalDateTime.setHours(hours);
//     finalDateTime.setMinutes(parseInt(time.minutes, 10));

//     onChange?.(finalDateTime.toISOString());
//     clearError?.();
//     setIsOpen(false);
//   };

//   const clearDateTime = (e) => {
//     e?.stopPropagation();
//     if (disabled || loading) return;
//     setSelectedDateTime(null);
//     setTime({ hours: "12", minutes: "00", period: "AM" });
//     onChange?.(null);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const displayFormat = "PPP h:mm aa";

//   return (
//     <div ref={wrapperRef} className="w-full relative group">
//       <div
//         ref={refs.setReference}
//         className={`relative border-b ${
//           error ? "border-red-500" : "border-gray-dark"
//         } focus-within:border-primary transition-all min-h-[28px] py-0.5 flex items-center ${
//           disabled || loading ? "opacity-70" : ""
//         }`}
//         onClick={() => !disabled && !loading && setIsOpen(true)}
//       >
//         {/* Icon */}
//         {/* {icon && (
//           <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
//             <Icon
//               icon={icon}
//               className={`h-5 w-5 ${
//                 error ? "text-red-500" : "text-gray-400"
//               } group-focus-within:text-primary`}
//             />
//           </div>
//         )} */}

//         {/* Input field */}
//         <div className={`flex-1 ${icon ? "pr-10" : "pr-2"}`}>
//           <input
//             type="text"
//             name={name} // For react-hook-form
//             value={
//               selectedDateTime ? format(selectedDateTime, displayFormat) : ""
//             }
//             onFocus={() => setIsOpen(true)}
//             placeholder={placeholder}
//             readOnly
//             disabled={disabled || loading}
//             className={`text-sm focus:outline-none bg-transparent w-full placeholder:text-gray-dark ${
//               disabled || loading ? "cursor-not-allowed" : ""
//             }`}
//           />
//         </div>

//         {/* Clear Icon */}
//         {!loading && selectedDateTime && !disabled && (
//           <button
//             type="button"
//             onClick={clearDateTime}
//             className="absolute right-8 text-gray-400 hover:text-red-500"
//           >
//             <Icon icon="mdi:close-circle" className="h-4 w-4" />
//           </button>
//         )}

//         {/* Chevron Icon */}
//         <div
//           className={`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none ${
//             error ? "text-red-500" : "text-gray-400"
//           }`}
//         >
//           <Icon
//             // icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
//             icon={icon}
//             className="h-5 w-5"
//           />
//         </div>

//         {/* Label */}
//         <label
//           className={`text-sm absolute left-0 text-gray-light truncate max-w-[calc(100%-18px)] float-labels 
//             ${
//               // icon ? "left-10" : "left-0"
//               "left-0"
//             } 
//           ${error ? "text-red-500" : "peer-focus:text-primary"} ${
//             selectedDateTime || isOpen
//               ? "text-xs -top-3 left-0"
//               : "peer-placeholder-shown:text-sm peer-placeholder-shown:top-0 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3"
//           } ${disabled || loading ? "cursor-not-allowed" : ""}`}
//         >
//           {label}
//         </label>

//         {/* Tooltip */}
//         {tooltip && (
//           <div className="absolute inset-y-0 right-2 flex items-center">
//             <div className="relative group/tooltip">
//               <Icon
//                 icon="mdi:information"
//                 className={`h-4 w-4 ${
//                   disabled || loading ? "text-gray-300" : "text-gray-400"
//                 } cursor-pointer`}
//               />
//               <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
//                 {tooltip}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* DateTime dropdown */}
//       {isOpen && !disabled && !loading && (
//         <div
//           ref={refs.setFloating}
//           style={floatingStyles}
//           className="absolute z-20 mt-1 w-fit bg-white shadow-lg rounded-md p-4"
//         >
//           <div className="flex flex-col gap-4">
//             {/* Date Picker */}
//             <div className="border-b pr-4">
//               <DayPicker
//                 mode="single"
//                 selected={selectedDateTime}
//                 onSelect={handleDateSelect}
//                 disabled={disabled}
//                 navLayout="around"
//                 showOutsideDays
//                 captionLayout="dropdown"
//                 startMonth={getPreviousYears()}
//                 endMonth={getNextYears()}
//                 classNames={{
//                   today: "text-primary font-semibold",
//                   selected: "bg-primary text-white rounded-md",
//                   day: "hover:bg-primary hover:text-white transition-colors",
//                   chevron: "fill-primary stroke-primary w-5 h-5",
//                 }}
//                 styles={{
//                   chevron: { color: "var(--primary)" }, // extra safety
//                 }}
//               />
//             </div>

//             {/* Time Picker */}
//             <div className="flex flex-col gap-2">
//               <h3 className="text-sm font-medium">Select Time</h3>
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-1">
//                   <input
//                     type="number"
//                     name="hours"
//                     min="1"
//                     max="12"
//                     value={time.hours}
//                     onChange={handleTimeChange}
//                     className="w-16 px-2 py-1 border rounded text-center"
//                     placeholder="HH"
//                   />
//                   <span>:</span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <input
//                     type="number"
//                     name="minutes"
//                     min="0"
//                     max="59"
//                     value={time.minutes}
//                     onChange={handleTimeChange}
//                     className="w-16 px-2 py-1 border rounded text-center"
//                     placeholder="MM"
//                   />
//                 </div>
//                 <select
//                   name="period"
//                   value={time.period}
//                   onChange={handlePeriodChange}
//                   className="w-16 px-2 py-1 border rounded"
//                 >
//                   <option value="AM">AM</option>
//                   <option value="PM">PM</option>
//                 </select>
//               </div>

//               <button
//                 type="button"
//                 onClick={handleCompleteSelection}
//                 disabled={!selectedDateTime}
//                 className={`mt-2 px-4 py-1 text-sm rounded ${
//                   selectedDateTime
//                     ? "bg-primary text-white hover:bg-primary-dark"
//                     : "bg-gray-200 text-gray-500 cursor-not-allowed"
//                 }`}
//               >
//                 Apply
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Helper/Error Text */}
//       {helperText && !error && (
//         <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
//       )}
//       {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
//     </div>
//   );
// }
