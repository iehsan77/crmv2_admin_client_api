"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import InputControl from "@/components/FormControls/InputControl";
import Icons, { SystemIcons } from "@/components/Icons";

export default function IconClassInput({ title = "Icon Class" }) {
  const { setValue, watch } = useFormContext();
  const formIcon = watch("icon_class");
  const [showDialog, setShowDialog] = useState(false);
  const [tempSelectedIcon, setTempSelectedIcon] = useState(formIcon || "");

  const iconOptions = SystemIcons();

  const handleIconClick = (iconName) => {
    setTempSelectedIcon(iconName);
  };

  const confirmSelection = () => {
    setValue("icon_class", tempSelectedIcon, { shouldValidate: true });
    setShowDialog(false);
  };

  const cancelSelection = () => {
    setTempSelectedIcon(formIcon); // Reset temp selection
    setShowDialog(false);
  };

  return (
    <>
      <InputControl
        name="icon_class"
        value={formIcon}
        title={title}
        onClick={() => setShowDialog(true)}
        readOnly
      />

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-[90%] h-[80vh] rounded-lg shadow-xl flex overflow-hidden">
            {/* Left Column */}
            <div className="w-3/4 h-full overflow-y-auto p-6 border-r border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Select an Icon</h3>
              <ul className="grid grid-cols-8 gap-4">
                {iconOptions.map((iconName) => (
                  <li
                    key={iconName}
                    onClick={() => handleIconClick(iconName)}
                    className={`cursor-pointer p-2 rounded flex flex-col items-center hover:bg-gray-100 ${
                      tempSelectedIcon === iconName ? "bg-gray-200" : ""
                    }`}
                  >
                    <Icons iconName={iconName} className="w-6 h-6 mb-1" />
                    <span className="text-[10px] text-center break-all">{iconName}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column */}
            <div className="w-1/4 h-full p-6 flex flex-col items-center justify-center bg-gray-50 relative">
              <h4 className="text-md font-semibold mb-4">Preview</h4>
              {tempSelectedIcon ? (
                <>
                  <Icons iconName={tempSelectedIcon} className="w-24 h-24 text-[#1E3A8A] mb-2" />
                  <p className="text-xs break-all text-center">{tempSelectedIcon}</p>

                  <button
                    onClick={confirmSelection}
                    className="mt-4 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No icon selected</p>
              )}

              <button
                onClick={cancelSelection}
                className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
