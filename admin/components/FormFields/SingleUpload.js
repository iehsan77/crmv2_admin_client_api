"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

import toast from "react-hot-toast";

export default function SingleUpload({
  label,
  icon = "mdi:image-plus",
  error,
  helperText,
  tooltip,
  disabled,
  value = null,
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB
  setError,
  name,
  accept = "image/*",
  id,
  ...props
}) {
  const inputId = id || `single-upload-${Math.random().toString(36)}`;
  const [file, setFile] = useState(value);
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (value !== file) {
      setFile(value);
    }
  }, [value]);

  const clearError = () => {
    if (setError && name) setError(name, { message: "" });
  };

  const validateFile = (file) => {
    clearError();

    if (!file.type.match("image.*")) {
      const msg = "Only image files are allowed";
      toast.error(msg)
      setError?.(name, { type: "validate", message: msg });
      return { valid: false, error: msg };
    }

    if (file.size > maxSize) {
      const msg = `Max file size is ${maxSize / 1024 / 1024}MB`;
      setError?.(name, { type: "validate", message: msg });
      return { valid: false, error: msg };
    }

    return { valid: true };
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const { valid } = validateFile(selected);
    if (!valid) return;

    setFile(selected);
    onChange?.(selected);
  };

  const handleRemove = () => {
    setFile(null);
    onChange?.(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const { valid } = validateFile(droppedFile);
    if (!valid) return;

    setFile(droppedFile);
    onChange?.(droppedFile);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm mb-1 ${error ? "text-red-500" : "text-gray-dark"
            }`}
        >
          {label}
        </label>
      )}

      <div className="grid gap-3 grid-cols-1">
        {file ? (
          <div className="relative group w-fit">
            <div className="w-44 h-44 rounded border border-gray-300 overflow-hidden">
              <Image
                src={
                  typeof file === "string" ? file : URL.createObjectURL(file)
                }
                alt="preview"
                width={44}
                height={44}
                className="w-44 h-44 object-contain"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={disabled}
            >
              <Icon icon="mdi:close" className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`w-44 h-44 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer ${disabled
                ? "opacity-50 cursor-not-allowed"
                : dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "hover:border-gray-400"
              } transition-all border-gray-300`}
          >
            <Icon icon={icon} className="h-8 w-8 mb-2 text-gray-400" />
            <span className="text-xs text-gray-500">
              {dragActive ? "Drop file here" : "Click or drag to upload"}
            </span>
          </div>
        )}
      </div>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        {...props}
      />

      {helperText && !error && (
        <div className="text-xs text-gray-500 mt-1">{helperText}</div>
      )}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      {tooltip && (
        <div className="flex items-center mt-1 text-gray-400">
          <Icon icon="mdi:information" className="h-3 w-3 mr-1" />
          <span className="text-xs">{tooltip}</span>
        </div>
      )}
    </div>
  );
}
