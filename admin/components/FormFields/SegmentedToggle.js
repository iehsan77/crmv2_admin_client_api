"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import clsx from "clsx";

export default function SegmentedToggle({
  value,
  options,
  onChange,
  className,
}) {
  const [left, right] =
    options?.map((option) => ({
      label: option.label,
      value: option.value,
    })) || [];

  // toggle function (0 ↔ 1)
  const handleToggle = () => {
    if (value === left.value) {
      onChange(right.value);
    } else {
      onChange(left.value);
    }
  };

  return (
    <div
      className={clsx("relative inline-flex cursor-pointer", className)}
      onClick={handleToggle}
    >
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={onChange}
        className="relative inline-flex items-center w-[64px] h-9 bg-[#F2F2F2] rounded-full p-1 pointer-events-none"
      >
        {/* knob */}
        <span
          className={clsx(
            "absolute top-1 left-1 w-[calc(50%-4px)] h-7 bg-primary rounded-full shadow-md transition-all duration-300",
            value === right.value && "translate-x-full"
          )}
        />
        <div className="flex justify-between w-full z-10 text-xs font-medium select-none">
          <ToggleGroupItem
            value={left.value}
            className={clsx(
              "flex-1 text-center transition-colors rounded-full !bg-transparent text-xs",
              value === left.value ? "!text-white" : "text-gray-500"
            )}
          >
            {left.label}
          </ToggleGroupItem>
          <ToggleGroupItem
            value={right.value}
            className={clsx(
              "flex-1 text-center transition-colors rounded-full !bg-transparent text-xs",
              value === right.value ? "!text-white" : "text-gray-500"
            )}
          >
            {right.label}
          </ToggleGroupItem>
        </div>
      </ToggleGroup>
    </div>
  );
}

// "use client";

// import clsx from "clsx";

// export default function SegmentedToggle({
//   value,
//   options,
//   onChange,
//   className,
// }) {
//   const [left, right] = options;
//   const isRightActive = value === right.value;

//   return (
//     <div
//       role="radiogroup"
//       className={clsx(
//         "relative inline-flex items-center w-[72px] h-10 bg-[#F2F2F2] rounded-full p-1 transition-colors duration-300",
//         className
//       )}
//     >
//       {/* Knob */}
//       <span
//         className={clsx(
//           "absolute top-1 left-1 w-[calc(50%-4px)] h-8 bg-primary rounded-full shadow-md transition-all duration-300",
//           isRightActive && "translate-x-full"
//         )}
//       />
//       {/* Buttons */}
//       <div className="flex justify-between w-full z-10 text-xs font-medium">
//         <button
//           type="button"
//           role="radio"
//           aria-checked={!isRightActive}
//           className={clsx(
//             "flex-1 text-center transition-colors",
//             !isRightActive ? "text-white" : "text-gray-500"
//           )}
//           onClick={() => onChange(left.value)}
//         >
//           {left.label}
//         </button>
//         <button
//           type="button"
//           role="radio"
//           aria-checked={isRightActive}
//           className={clsx(
//             "flex-1 text-center transition-colors",
//             isRightActive ? "text-white" : "text-gray-500"
//           )}
//           onClick={() => onChange(right.value)}
//         >
//           {right.label}
//         </button>
//       </div>
//     </div>
//   );
// }
