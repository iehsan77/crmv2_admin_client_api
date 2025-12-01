"use client";



export default function Alert({
  type = "normal",
  text = "Heads up! You have unsaved changes",
}) {
  const icon = ICONS[type] || ICONS.normal;
  const style = STYLES[type] || STYLES.normal;

  return (
    <div
      className={`border px-4 py-3 shadow-sm text-sm font-medium flex items-center space-x-2 ${style}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

const ICONS = {
  info: (
    <svg
      className="h-5 w-5 text-blue-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg
      className="h-5 w-5 text-green-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  warning: (
    <svg
      className="h-5 w-5 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M12 18h.01M12 10V6m0 4v6"
      />
    </svg>
  ),
  danger: (
    <svg
      className="h-5 w-5 text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  normal: (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
      />
    </svg>
  ),
};

const STYLES = {
  info: "text-[#1E3A8A] bg-blue-50 border-blue-200",
  success: "text-green-600 bg-green-50 border-green-200",
  warning: "text-yellow-700 bg-yellow-50 border-yellow-300",
  danger: "text-red-600 bg-red-50 border-red-200",
  normal: "text-gray-600 bg-gray-50 border-gray-200",
};