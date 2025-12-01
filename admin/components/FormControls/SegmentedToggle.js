"use client";

import clsx from "clsx";

export default function SegmentedToggle({
  value,
  options,
  onChange,
  className,
}) {
  const [left, right] = options;

  const isRightActive = value === right.value;

  return (
    <div
      role="radiogroup"
      className={clsx(
        "relative inline-flex items-center w-35 h-9 bg-[#F2F2F2] rounded-md p-1 transition-colors duration-300",
        className
      )}
    >
      <span
        className={clsx(
          "absolute top-1 left-1 w-[calc(50%-4px)] h-7 bg-primary rounded-md shadow-md transition-all duration-300",
          isRightActive && "translate-x-full"
        )}
      />
      <div className="flex justify-between w-full z-10 text-xs font-medium">
        <button
          type="button"
          role="radio"
          aria-checked={!isRightActive}
          className={clsx(
            "text-xs flex-1 text-center transition-colors",
            !isRightActive ? "text-white" : "text-gray-400"
          )}
          onClick={() => onChange(left.value)}
        >
          {left.label}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isRightActive}
          className={clsx(
            "text-xs flex-1 text-center transition-colors",
            isRightActive ? "text-white" : "text-gray-400"
          )}
          onClick={() => onChange(right.value)}
        >
          {right.label}
        </button>
      </div>
    </div>
  );
}
