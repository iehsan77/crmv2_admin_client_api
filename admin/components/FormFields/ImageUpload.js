"use client";
import { GET } from "@/actions/actions";
import { endpoints } from "@/utils/endpoints";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";

import toast from "react-hot-toast";

export default function ImageUpload({
  label,
  icon,
  error,
  helperText,
  tooltip,
  disabled,
  value = [],
  previewValues = [],
  onChange,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  aspectRatio = 1, // square by default
  setError,
  setValue,
  name,
  accept = "image/*",
  id,
  deleteOldImageUrl,
  ...props
}) {
  const inputId = id || `image-upload-${Math.random().toString(36)}`;
  const [files, setFiles] = useState(value || []);
  const [previewFiles, setPreviewFiles] = useState(previewValues || []);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  useEffect(() => {
    setFiles(value);
    setPreviewFiles(previewValues);
  }, [value, previewValues]);

  const clearError = () => {
    if (setError && name) {
      setError(name, { message: "" });
    }
  };

  const validateFile = (file) => {
    clearError();

    // Check file type
    if (!file.type.match("image.*")) {
      const errorMsg = "Only image files are allowed";
      toast.error(errorMsg);
      if (setError && name) {
        setError(name, {
          type: "validate",
          message: errorMsg,
        });
      }
      return { valid: false, error: errorMsg };
    }

    // Check file size
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds ${maxSize / 1024 / 1024}MB limit`;
      if (setError && name) {
        setError(name, {
          type: "validate",
          message: errorMsg,
        });
      }
      return { valid: false, error: errorMsg };
    }

    return { valid: true };
  };

  const handleFileChange = (newFiles) => {
    clearError();
    const validFiles = [];
    const errors = [];

    // Convert FileList to array and validate each file
    const fileArray = Array.from(newFiles);

    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    // If there are errors, show them
    if (errors.length > 0) {
      console.error("Validation errors:", errors.join("\n"));
      setError(name, { message: errors.join("\n") });
    }

    if (validFiles.length === 0) return;

    // Check if we're exceeding maxFiles
    const totalFilesAfterUpload = files.length + validFiles.length;
    if (totalFilesAfterUpload > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} files allowed`;
      if (setError && name) {
        setError(name, {
          type: "maxFiles",
          message: errorMsg,
        });
      }
      return;
    }

    const newFileValues = [...files, ...validFiles];
    setFiles(newFileValues);

    // Call onChange with the new files array
    if (onChange) {
      onChange(newFileValues);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      // Filter to maxFiles limit
      const totalFiles =
        files.length + previewFiles.length + acceptedFiles.length;

      if (totalFiles > maxFiles) {
        setError(name, {
          type: "manual",
          message: `Maximum ${maxFiles} file${
            maxFiles > 1 ? "s" : ""
          } allowed.`,
        });
        return;
      }

      const newFiles = [...files, ...acceptedFiles];
      // const newPreviews = [...previewFiles, ...acceptedFiles];

      setFiles(newFiles);
      // setPreviewFiles(newPreviews);
      if (onChange) onChange(newFiles);
    },
    [files, previewFiles, maxFiles, onChange, name, setError]
  );

  const removeFile = (index) => {
    const isOld = typeof previewFiles[index] === "string";

    const newPreviewFiles = previewFiles.filter((_, i) => i !== index);
    setPreviewFiles(newPreviewFiles);

    if (!isOld) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      if (onChange) onChange(newFiles);
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

  const renderFiles = (file, index) => {
    return (
      <div key={index} className="relative group w-fit">
        <div className="w-44 h-44 rounded border border-gray-300 overflow-hidden">
          <Image
            src={URL.createObjectURL(file)}
            alt={file.name || `Preview ${index + 1}`}
            width={44}
            height={44}
            className="w-44 h-44 object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <Icon icon="mdi:close" className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const renderPreview = (file, index) => {
    const isDeleting = deletingIds.has(file.id);
    return (
      <div key={index} className="relative group w-fit">
        <div className="w-44 h-44 rounded border border-gray-300 overflow-hidden">
          <Image
            src={file?.url}
            alt={file.name || `Preview ${index + 1}`}
            width={44}
            height={44}
            className="w-44 h-44 object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => !isDeleting && deleteOldImage(file.id)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <Icon
            icon={isDeleting ? "line-md:loading-alt-loop" : "mdi:close"}
            className="w-3 h-3"
          />
        </button>
      </div>
    );
  };

  const renderUploadArea = () => {
    return (
      <div
        ref={dropAreaRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-44 h-44 flex flex-col items-center justify-center border-2 border-dashed rounded ${
          isDragging ? "border-primary bg-primary/10" : "border-gray-300"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-gray-400"
        } transition-all`}
      >
        <Icon
          icon={icon || "mdi:image-plus"}
          className={`h-8 w-8 mb-2 ${
            isDragging ? "text-primary" : "text-gray-400"
          }`}
        />
        <span className="text-xs text-gray-500">Click or drag to upload</span>
      </div>
    );
  };

  return (
    <div className="w-full">
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

      {/* Grid of images and upload areas */}
      <div
        className={`grid gap-3 ${
          maxFiles === 1
            ? "grid-cols-1"
            : maxFiles === 2
            ? "grid-cols-2"
            : maxFiles === 3
            ? "grid-cols-3"
            : "grid-cols-4" // For maxFiles >= 4
        }`}
      >
        {/* Existing images */}
        {previewFiles?.length ? (
          previewFiles.map((file, index) => renderPreview(file, index))
        ) : (
          <></>
        )}
        {files?.length ? (
          files.map((file, index) => renderFiles(file, index))
        ) : (
          <></>
        )}

        {/* Upload area (shown if we haven't reached maxFiles) */}
        {files?.length + previewFiles.length < maxFiles && (
          <div className="">{renderUploadArea()}</div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        disabled={disabled}
        {...props}
      />

      {/* Helper Text */}
      {helperText && !error && (
        <div className="text-xs text-gray-500 mt-1">{helperText}</div>
      )}

      {/* Error Message */}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}

      {/* Tooltip */}
      {tooltip && (
        <div className="flex items-center mt-1 text-gray-400">
          <Icon icon="mdi:information" className="h-3 w-3 mr-1" />
          <span className="text-xs">{tooltip}</span>
        </div>
      )}
    </div>
  );
}
