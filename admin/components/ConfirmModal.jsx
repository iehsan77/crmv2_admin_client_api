"use client";

import useToggleStore from "@/stores/useToggleStore";

export default function ConfirmModal() {
  const { isOpen, close, message, onConfirm } = useToggleStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md">
        <p className="mb-4 text-center">
          {message || "Are you sure you want to proceed?"}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              onConfirm?.();
              close();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Yes
          </button>
          <button onClick={close} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
