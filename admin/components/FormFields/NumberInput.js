"use client";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

export default function NumberInput({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  placeholder = " ",
  id,
  min,
  max,
  step = 1,
  dropdownOptions = [],
  dropdownprops,
  allowNegative = false,
  allowDecimal = false, // 👈 new prop added
  maxDigits = 20,
  // react-hook-form injected props
  name,
  onChange,
  onBlur,
  value: formValue,
  defaultValue,
  ref,
  ...rest
}) {
  const [value, setValue] = useState(formValue ?? defaultValue ?? "");

  // sync with form updates
  useEffect(() => {
    if (formValue !== undefined && formValue !== value) {
      setValue(formValue);
    }
  }, [formValue]);

  const handleChange = (e) => {
    let inputVal = e.target.value;

    // remove negative sign if not allowed
    if (!allowNegative && inputVal.startsWith("-")) {
      inputVal = inputVal.replace("-", "");
    }

    // ✅ choose regex based on allowDecimal + allowNegative
    const regex = allowDecimal
      ? allowNegative
        ? /^-?\d*\.?\d*$/
        : /^\d*\.?\d*$/
      : allowNegative
      ? /^-?\d*$/
      : /^\d*$/;

    if (!regex.test(inputVal)) return;

    // ✅ limit integer and decimal digits separately
    const cleanVal = inputVal.replace("-", "");
    const [integerPart, decimalPart] = cleanVal.split(".");

    if (integerPart.length > maxDigits) return;
    if (decimalPart && decimalPart.length > 10) return; // optional decimal precision limit

    setValue(inputVal);

    // trigger react-hook-form
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name,
          value: inputVal,
        },
      });
    }
  };

  return (
    <div className="w-full relative group">
      <div
        className={`relative border-b ${
          error ? "border-red-500" : "border-gray-dark"
        } ${disabled ? "opacity-70" : ""} focus-within:border-primary transition-all`}
      >
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

        <div className="flex">
          <input
            type="text"
            id={id}
            name={name}
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`text-gray-dark w-full py-1 text-sm focus:outline-none peer ${
              icon ? "pl-10" : "pl-2"
            } ${disabled ? "cursor-not-allowed" : ""}`}
            {...rest}
          />

          <label
            className={`text-sm absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
              icon ? "left-10" : "left-0"
            } ${
              error ? "text-red-500" : "peer-focus:text-primary"
            } peer-placeholder-shown:text-sm peer-placeholder-shown:top-1 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3 -top-3 text-xs`}
          >
            {label}
          </label>

          {dropdownOptions?.length ? (
            <select
              {...dropdownprops}
              className="px-2 border-l border-gray-light text-sm text-gray-light ring-0 focus:ring-0 outline-0 focus:outline-0"
            >
              {dropdownOptions.map((e, i) => (
                <option key={i} value={e}>
                  {e}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {tooltip && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <div className="relative group/tooltip">
              <Icon
                icon={"mdi:information"}
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                {tooltip}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {helperText && !error && (
          <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
        )}
      </div>

      {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
    </div>
  );
}


// "use client";
// import { Icon } from "@iconify/react";
// import { useState, useEffect } from "react";

// export default function NumberInput({
//   label,
//   icon,
//   error,
//   helperText,
//   tooltip,
//   disabled,
//   placeholder = " ",
//   id,
//   min,
//   max,
//   step = 1,
//   dropdownOptions = [],
//   dropdownprops,
//   allowNegative = false,
//   maxDigits = 20,
//   // react-hook-form injected props
//   name,
//   onChange,
//   onBlur,
//   value: formValue,
//   defaultValue,
//   ref,
//   ...rest
// }) {
//   const [value, setValue] = useState(formValue ?? defaultValue ?? "");

//   // sync with form updates
//   useEffect(() => {
//     if (formValue !== undefined && formValue !== value) {
//       setValue(formValue);
//     }
//   }, [formValue]);

//   const handleChange = (e) => {
//     let inputVal = e.target.value;

//     if (!allowNegative && inputVal.startsWith("-")) {
//       inputVal = inputVal.replace("-", "");
//     }

//     const regex = allowNegative ? /^-?\d*$/ : /^\d*$/;
//     if (!regex.test(inputVal)) return;

//     const digitCount = inputVal.replace("-", "").length;
//     if (digitCount > maxDigits) return;

//     setValue(inputVal);

//     // 🔗 call hook-form's onChange
//     if (onChange) {
//       onChange({
//         ...e,
//         target: {
//           ...e.target,
//           name,
//           value: inputVal,
//         },
//       });
//     }
//   };

//   return (
//     <div className="w-full relative group">
//       <div
//         className={`relative border-b ${
//           error ? "border-red-500" : "border-gray-dark"
//         } ${disabled ? "opacity-70" : ""} focus-within:border-primary transition-all`}
//       >
//         {icon && (
//           <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
//             <Icon
//               icon={icon}
//               className={`h-5 w-5 ${
//                 error ? "text-red-500" : "text-gray-400"
//               } group-focus-within:text-primary`}
//             />
//           </div>
//         )}

//         <div className="flex">
//           <input
//             type="text"
//             id={id}
//             name={name}
//             ref={ref}
//             value={value}
//             onChange={handleChange}
//             onBlur={onBlur}
//             disabled={disabled}
//             placeholder={placeholder}
//             className={`text-gray-dark w-full py-1 text-sm focus:outline-none peer ${
//               icon ? "pl-10" : "pl-2"
//             } ${disabled ? "cursor-not-allowed" : ""}`}
//             {...rest}
//           />

//           <label
//             className={`text-sm absolute left-0 text-gray-light cursor-text truncate max-w-[calc(100%-18px)] float-labels ${
//               icon ? "left-10" : "left-0"
//             } ${
//               error ? "text-red-500" : "peer-focus:text-primary"
//             } peer-placeholder-shown:text-sm peer-placeholder-shown:top-1 peer-focus:text-xs peer-focus:left-0 peer-focus:-top-3 -top-3 text-xs`}
//           >
//             {label}
//           </label>

//           {dropdownOptions?.length ? (
//             <select
//               {...dropdownprops}
//               className="px-2 border-l border-gray-light text-sm text-gray-light ring-0 focus:ring-0 outline-0 focus:outline-0"
//             >
//               {dropdownOptions?.map((e, i) => (
//                 <option key={i} value={e}>
//                   {e}
//                 </option>
//               ))}
//             </select>
//           ) : null}
//         </div>

//         {tooltip && (
//           <div className="absolute inset-y-0 right-2 flex items-center">
//             <div className="relative group/tooltip">
//               <Icon
//                 icon={"mdi:information"}
//                 className="h-4 w-4 text-gray-400 cursor-pointer"
//               />
//               <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
//                 {tooltip}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="flex items-center justify-between">
//         {helperText && !error && (
//           <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
//         )}
//       </div>

//       {error && <div className="text-[10px] text-red-500 mt-1">{error}</div>}
//     </div>
//   );
// }
