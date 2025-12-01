"use client";
import { GET } from "@/helper/ServerSideActions";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export default function MultiImageUpload({
  label,
  error,
  helperText,
  tooltip,
  disabled,
  value = [],
  previewValues = [],
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB
  setError,
  name,
  accept = {
    "image/jpeg": [".jpeg", ".jpg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "text/plain": [".txt"],
  },
  onRemove,
  deleteOldImageUrl,
  ...props
}) {
  const [files, setFiles] = useState(value);
  const [previewFiles, setPreviewFiles] = useState(previewValues);
  const [dragActive, setDragActive] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const fileInputRef = useRef(null);

  // Only update state when value or previewValues actually change
  useEffect(() => {
    if (JSON.stringify(files) !== JSON.stringify(value)) {
      setFiles(value);
    }
    if (JSON.stringify(previewFiles) !== JSON.stringify(previewValues)) {
      setPreviewFiles(previewValues);
    }
  }, [value, previewValues]);

  const clearError = useCallback(() => {
    if (setError && name) setError(name, { message: "" });
  }, [setError, name]);

  const validateFile = useCallback(
    (file) => {
      clearError();
      const allowedTypes = Object.keys(accept);
      if (!allowedTypes.includes(file?.type)) {
        const extensions = Object.values(accept).flat().join(", ");
        toast.error(`Invalid file type. Allowed: ${extensions}`);
        setError?.(name, { message: `Invalid file type` });
        return false;
      }
      if (file?.size > maxSize) {
        toast.error(`Max file size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        setError?.(name, { message: "File too large" });
        return false;
      }
      return true;
    },
    [accept, maxSize, name, setError, clearError]
  );

  const handleFiles = useCallback(
    (selected) => {
      const validFiles = selected.filter(validateFile);
      if (!validFiles.length) return;
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, validateFile, onChange]
  );

  const handleRemove = useCallback(
    (index) => {
      const updated = files.filter((_, i) => i !== index);
      setFiles(updated);
      onChange?.(updated);
    },
    [files, onChange, onRemove]
  );
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleFileChange = (e) => {
    handleFiles(Array.from(e.target.files || []));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  
  const deleteOldImage = async (id) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const response = await GET(deleteOldImageUrl(id));
      if (response?.status === 200) {
        setPreviewFiles((prev) => prev.filter((item) => item.id !== id));
        onRemove?.(previewFiles?.filter((item) => item.id !== id));
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

  const renderFilePreview = (file, index, isOld = false) => {
    const isImage = isOld
      ? file?.url?.match(/\.(jpeg|jpg|png|webp)$/i)
      : file?.type?.startsWith("image/");
    const isDeleting = isOld && deletingIds.has(file?.id);

    return (
      <div key={index} className="relative group w-fit">
        <div className="w-18 h-18 rounded border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
          {isImage ? (
            <Image
              src={isOld ? file?.url : URL.createObjectURL(file)}
              alt={file?.name || `Preview ${index + 1}`}
              width={72}
              height={72}
              className="object-contain"
            />
          ) : (
            <FileIcon file={file} />
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            isOld ? !isDeleting && deleteOldImage(file?.id) : handleRemove(index)
          }
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <Icon
            icon={
              isOld && isDeleting
                ? "line-md:loading-alt-loop"
                : "mdi:close"
            }
            className="w-3 h-3"
          />
        </button>
      </div>
    );
  };

  const acceptString = Object.values(accept).flat().join(",");

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

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : dragActive
            ? "border-primary bg-blue-50"
            : "hover:border-primary"
        } transition-all border-[#ABCCFB] gap-2`}
      >
        <Icon
          icon="ri:upload-cloud-2-line"
          className="h-12 w-12 text-primary"
        />
        <span className="text-base text-gray-500">
          {dragActive ? "Drop files here" : "Click or drag to upload files"}
        </span>
        <span className="text-xs text-gray-500">
          Max size: {maxSize / 1024 / 1024}MB
        </span>
      </div>

      {(previewFiles?.length > 0 || files.length > 0) && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
          {previewFiles?.map((f, i) => renderFilePreview(f, i, true))}
          {files.map((f, i) => renderFilePreview(f, i))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        multiple
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

function FileIcon({ file }) {
  let icon = "mdi:file";
  if (file?.type === "application/pdf") icon = "mdi:file-pdf-box";
  if (
    file?.type === "application/msword" ||
    file?.type?.includes("wordprocessingml")
  )
    icon = "mdi:file-word-box";
  if (file?.type === "text/plain") icon = "mdi:file-document-outline";

  return (
    <div className="flex flex-col items-center justify-center text-gray-600">
      <Icon icon={icon} className="w-8 h-8" />
      <span className="text-[10px] truncate w-16 text-center">
        {file?.name || "Document"}
      </span>
    </div>
  );
}
