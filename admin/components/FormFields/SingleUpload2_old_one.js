"use client";
import { Icon } from "@iconify/react";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

import toast from "react-hot-toast";

export default function SingleUpload2({
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
  isHide,
  onRemove,
  ...props
}) {
  const [file, setFile] = useState(value);
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (value instanceof File) {
      setFile(value);
    } else if (typeof value === "string" && value) {
      setFile(value);
    } else {
      setFile(null);
    }

    // return () => {
    //   if (file instanceof File) {
    //     URL.revokeObjectURL(file);
    //   }
    // };
  }, [value]);

  // useEffect(() => {
  //   if (value !== file) {
  //     setFile(value);
  //   }
  // }, [value]);

  const clearError = () => {
    if (setError && name) setError(name, { message: "" });
  };

  const validateFile = async (file) => {
    clearError();

    if (!file?.type.startsWith("image/")) {
      const msg = "Only image files are allowed";
      toast.error(msg);
      setError?.(name, msg);
      return false;
    }

    if (file?.size > maxSize) {
      const msg = `Max file size is ${Math.round(maxSize / 1024 / 1024)}MB`;
      setError?.(name, msg);
      return { valid: false, error: msg };
    }

    return { valid: true };
  };

  const handleFileChange = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const selected = e.target.files?.[0];
    if (!selected) return;

    const { valid } = await validateFile(selected);
    if (!valid) return;

    setFile(selected);
    onChange?.(selected);

    // ✅ Reset input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    const { valid } = await validateFile(droppedFile);
    if (!valid) return;

    setFile(droppedFile);
    onChange?.(droppedFile);
  };

  const handleRemove = () => {
    setFile(null);

    // ✅ Reset file input safely
    if (fileInputRef?.current) {
      fileInputRef.current.value = "";
    }

    // ✅ Callbacks (safe optional calls)
    onRemove?.();
    onChange?.("");
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

  const deleteOldImage = async (id) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const response = await GET(deleteOldImageUrl(id));
      if (response?.status === 200) {
        setPreviewFiles((prev) => prev.filter((item) => item.id !== id));
        toast.success("File deleted successfully");
      } else {
        toast.error(response?.message || "Failed to delete image");
      }
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          className={`block text-sm mb-1 ${
            error ? "text-red-500" : "text-gray-dark"
          }`}
        >
          {label}
        </label>
      )}

      <div className="grid gap-3 grid-cols-1">
        {file ? (
          <div className="relative group w-full h-32">
            <div className="flex items-center justify-center w-full h-full p-5 rounded border-2 border-dashed border-gray-300 overflow-hidden">
              <Image
                src={
                  typeof file === "string"
                    ? file
                    : file instanceof File
                    ? URL.createObjectURL(file)
                    : ""
                }
                alt="preview"
                width={100}
                height={100}
                className="object-contain w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                isHide ? "hidden" : "block"
              }`}
              disabled={disabled}
            >
              <Icon icon="mdi:close" className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current.click()}
            onDragEnter={disabled ? () => {} : handleDrag}
            onDragLeave={disabled ? () => {} : handleDrag}
            onDragOver={disabled ? () => {} : handleDrag}
            onDrop={disabled ? () => {} : handleDrop}
            className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : dragActive
                ? "border-primary bg-blue-50"
                : "hover:border-primary"
            } transition-all border-[#ABCCFB] gap-2`}
          >
            {/* <Upload className="text-gray-400" /> */}
            <Icon
              icon="ri:upload-cloud-2-line"
              className="h-12 w-12 text-primary"
            />
            <span className="text-base text-gray-500">
              {dragActive ? "Drop file here" : "Drop here to attach or upload"}
            </span>
            <span className="text-xs text-gray-500">
              Max size: {maxSize / 1024 / 1024}mb
            </span>
          </div>
        )}
      </div>

      <input
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
