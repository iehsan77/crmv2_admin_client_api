"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { Icon } from "@iconify/react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function TextEditor({
  label,
  value,
  onChange,
  placeholder = "Write something...",
  error,
  helperText,
  tooltip,
  id,
  disabled,
  ...props
}) {
  const inputId = id || `texteditor-${Math.random().toString(36)}`;
  const editorRef = useRef(null);

  const modules = {
    toolbar: [["bold", "italic", "underline", "strike"]],
  };

  const formats = ["bold", "italic", "underline", "strike"];

  return (
    <div className="w-full">
      <div className="relative group">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm mb-1 ${
              error ? "text-red-500" : "text-gray-dark"
            }`}
          >
            {label}
          </label>
        )}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute right-0 top-0 mt-0.5">
            <div className="relative group/tooltip">
              <Icon
                icon="mdi:information"
                className="h-4 w-4 text-gray-400 cursor-pointer"
              />
              <div className="absolute bottom-full right-0 mb-1 w-max rounded-md bg-gray-800 text-white text-xs py-1 px-2 hidden group-hover/tooltip:block">
                {tooltip}
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div
          className={`bg-white rounded border transition-all ${
            error ? "border-red-500" : "border-gray-300"
          } ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-gray-400 focus-within:border-primary"
          }`}
        >
          <ReactQuill
            id={inputId}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={disabled}
            ref={editorRef}
            {...props}
          />
        </div>

        {/* Helper/Error Text */}
        {error ? (
          <div className="text-[10px] text-red-500 mt-1">{error}</div>
        ) : (
          helperText && (
            <div className="text-[10px] text-gray-500 mt-1">{helperText}</div>
          )
        )}
      </div>
    </div>
  );
}
