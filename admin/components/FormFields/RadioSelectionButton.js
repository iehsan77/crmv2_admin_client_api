"use client";
import { Icon } from "@iconify/react";

export default function RadioSelectionButton({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  options = [],
  value,
  onChange,
  id,
  ...props
}) {
  const inputId = id || `radio-${Math.random().toString(36)}`;

  const handleChange = (selectedValue) => {
    if (!disabled && onChange) {
      onChange(selectedValue);
    }
  };

  return (
    <div>
      <div className="w-full relative group">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm mb-2 ${
              error ? "text-red-500" : "text-gray-dark"
            }`}
          >
            {label}
          </label>
        )}

        {/* Radio Buttons Container */}
        <div className="flex flex-wrap gap-4">
          {options.map((option) => (
            <label
              key={option.value}
              htmlFor={`${inputId}-${option.value}`}
              className={`flex items-center gap-2 cursor-pointer select-none ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {/* Native Styled Radio */}
              <input
                type="radio"
                id={`${inputId}-${option.value}`}
                name={inputId}
                value={option.value}
                checked={value === option.value}
                onChange={() => handleChange(option.value)}
                disabled={disabled}
                className="
                  appearance-none 
                  w-6 h-6 rounded-full border border-gray-400 
                  checked:border-primary 
                  relative 
                  before:content-[''] 
                  before:absolute before:inset-[5px] before:rounded-full 
                  before:bg-primary 
                  before:scale-0 checked:before:scale-100 
                  before:transition-transform
                "
                {...props}
              />

              {/* Icon */}
              {option.icon && (
                <Icon
                  icon={option.icon}
                  className={`h-4 w-4 ${
                    value === option.value ? "text-primary" : "text-gray-400"
                  }`}
                />
              )}

              {/* Label */}
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {/* Tooltip / Helper / Error */}
        <div className="flex items-center mt-1">
          {tooltip && (
            <div className="flex items-center mr-2">
              <div className="relative group/tooltip">
                <Icon
                  icon={"mdi:information"}
                  className="h-4 w-4 text-gray-400 cursor-pointer"
                />
                <div className="absolute bottom-full left-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                  {tooltip}
                </div>
              </div>
            </div>
          )}
          {helperText && !error && (
            <span className="text-xs text-gray-500">{helperText}</span>
          )}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}


// "use client";
// import { Icon } from "@iconify/react";

// export default function RadioSelectionButton({
//   label,
//   icon,
//   error,
//   helperText,
//   tooltip,
//   disabled,
//   options = [],
//   value,
//   onChange,
//   id,
//   ...props
// }) {
//   const inputId = id || `radio-${Math.random().toString(36)}`;

//   const handleChange = (selectedValue) => {
//     if (!disabled && onChange) {
//       onChange(selectedValue);
//     }
//   };

//   return (
//     <div>
//       <div className="w-full relative group">
//         {/* Label */}
//         {label && (
//           <label
//             htmlFor={inputId}
//             className={`block text-sm mb-2 ${
//               error ? "text-red-500" : "text-gray-dark"
//             }`}
//           >
//             {label}
//           </label>
//         )}

//         {/* Radio Buttons Container */}
//         <div className="flex flex-wrap gap-2">
//           {options.map((option) => (
//             <div
//               key={option.value}
//               className={`relative inline-flex items-center justify-center px-4 py-2 border rounded-md cursor-pointer transition-all ${
//                 value === option.value
//                   ? "border-primary text-primary"
//                   : "border-gray-light text-gray-light"
//               } ${
//                 disabled
//                   ? "cursor-not-allowed opacity-50"
//                   : "hover:border-primary hover:text-primary"
//               }`}
//               onClick={() => handleChange(option.value)}
//             >
//               {/* Icon */}
//               {option.icon && (
//                 <Icon
//                   icon={option.icon}
//                   className={`mr-2 h-4 w-4 ${
//                     value === option.value ? "text-primary" : "text-gray-light"
//                   }`}
//                 />
//               )}
              
//               {/* Option Label */}
//               <span className="text-sm">{option.label}</span>
              
//               {/* Hidden Radio Input */}
//               <input
//                 type="radio"
//                 id={`${inputId}-${option.value}`}
//                 checked={value === option.value}
//                 onChange={() => handleChange(option.value)}
//                 className="absolute opacity-0 w-0 h-0"
//                 disabled={disabled}
//                 {...props}
//               />
//             </div>
//           ))}
//         </div>

//         {/* Icon and Tooltip */}
//         <div className="flex items-center mt-1">
//           {/* Tooltip */}
//           {tooltip && (
//             <div className="flex items-center mr-2">
//               <div className="relative group/tooltip">
//                 <Icon
//                   icon={"mdi:information"}
//                   className="h-4 w-4 text-gray-400 cursor-pointer"
//                 />
//                 <div className="absolute bottom-full left-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
//                   {tooltip}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Helper Text */}
//           {helperText && !error && (
//             <span className="text-xs text-gray-500">{helperText}</span>
//           )}

//           {/* Error Message */}
//           {error && <span className="text-xs text-red-500">{error}</span>}
//         </div>
//       </div>
//     </div>
//   );
// }