"use client";

export default function Slider({ value, min = 0, max = 100, step = 1, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-sm text-gray-600 w-12 text-center">
        {Math.round(value)}
      </span>
    </div>
  );
}