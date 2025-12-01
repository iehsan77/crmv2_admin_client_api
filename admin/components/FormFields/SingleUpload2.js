"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SingleUpload2({
  label,
  icon = "ri:upload-cloud-2-line",
  error,
  helperText,
  tooltip,
  disabled,
  value = null,
  onChange,
  maxSize = 5 * 1024 * 1024, // 200MB
  setError,
  name,
  accept = "*/*",
  id,
  isHide,
  onRemove,
  ...props
}) {
  const [file, setFile] = useState(value);
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (value instanceof File) {
      setFile(value);
    } else if (typeof value === "string" && value) {
      setFile(value);
    } else {
      setFile(null);
    }
  }, [value]);

  const clearError = () => {
    if (setError && name) setError(name, { message: "" });
  };

  const validateFile = async (file) => {
    clearError();

    if (file?.size > maxSize) {
      const msg = `Max file size is ${Math.round(maxSize / 1024 / 1024)}MB`;
      setError?.(name, { type: "validate", message: msg });
      toast.error(msg);
      return { valid: false, error: msg };
    }

    return { valid: true };
  };

  const handleFileChange = async (e) => {
    e.preventDefault();
    const selected = e.target.files?.[0];
    if (!selected) return;

    const { valid } = await validateFile(selected);
    if (!valid) return;

    setFile(selected);
    onChange?.(selected);

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
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
    if (fileInputRef?.current) fileInputRef.current.value = "";
    onRemove?.("");
    onChange?.("");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // ✅ Improved file type detection
  const getFileType = (file) => {
    if (!file) return null;

    // For File objects
    if (file instanceof File) {
      const fileName = file.name?.toLowerCase() || "";
      const fileType = file.type?.toLowerCase() || "";

      // Check by file type first
      if (fileType.startsWith("image/")) return "image";
      if (fileType.startsWith("video/")) return "video";
      if (fileType === "application/pdf") return "pdf";

      // Check by file extension
      if (
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".webp") ||
        fileName.endsWith(".gif") ||
        fileName.endsWith(".bmp")
      ) {
        return "image";
      }

      if (
        fileName.endsWith(".mp4") ||
        fileName.endsWith(".avi") ||
        fileName.endsWith(".mov") ||
        fileName.endsWith(".mkv") ||
        fileName.endsWith(".webm")
      ) {
        return "video";
      }

      if (fileName.endsWith(".pdf")) return "pdf";
      if (fileName.endsWith(".doc") || fileName.endsWith(".docx"))
        return "word";
      if (
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".csv")
      )
        return "excel";
      if (
        fileName.endsWith(".zip") ||
        fileName.endsWith(".rar") ||
        fileName.endsWith(".7z")
      )
        return "archive";
      if (fileName.endsWith(".txt")) return "text";

      return "file";
    }

    // For string URLs - try to detect from URL
    if (typeof file === "string") {
      const url = file.toLowerCase();
      if (url.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/))
        return "image";
      if (url.match(/\.(mp4|avi|mov|mkv|webm)(\?.*)?$/)) return "video";
      if (url.match(/\.pdf(\?.*)?$/)) return "pdf";
      if (url.match(/\.(doc|docx)(\?.*)?$/)) return "word";
      if (url.match(/\.(xls|xlsx|csv)(\?.*)?$/)) return "excel";
      if (url.match(/\.(zip|rar|7z)(\?.*)?$/)) return "archive";
      if (url.match(/\.txt(\?.*)?$/)) return "text";
      return "file";
    }

    return "file";
  };

  const renderPreview = () => {
    if (!file) return null;

    const fileType = getFileType(file);

    // ✅ Show preview for image/video even if value is a URL string
    if (fileType === "image") {
      const src =
        typeof file === "string"
          ? file
          : file instanceof File
          ? URL.createObjectURL(file)
          : "";

      return (
        <Image
          src={src}
          alt="preview"
          width={100}
          height={100}
          className="object-contain w-full h-full"
        />
      );
    }

    if (fileType === "video") {
      const src =
        typeof file === "string"
          ? file
          : file instanceof File
          ? URL.createObjectURL(file)
          : "";

      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={src}
            className="max-w-full max-h-full object-contain"
            controls
            controlsList="nodownload"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Video
          </div>
        </div>
      );
    }

    // ✅ For all other types → show icon only
    let icon = "mdi:file";
    switch (fileType) {
      case "pdf":
        icon = "mdi:file-pdf-box";
        break;
      case "word":
        icon = "mdi:file-word-box";
        break;
      case "excel":
        icon = "mdi:file-excel-box";
        break;
      case "archive":
        icon = "mdi:folder-zip";
        break;
      case "text":
        icon = "mdi:file-document-outline";
        break;
      default:
        icon = "mdi:file";
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <Icon icon={icon} className="h-12 w-12 text-primary" />
        <span className="text-xs text-gray-600 mt-1 text-center break-words max-w-full">
          {file instanceof File ? file.name : "File"}
        </span>
        {file instanceof File && (
          <span className="text-[10px] text-gray-400 mt-1">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </div>
    );
  };

  const normalizeAccept = (accept) => {
    if (typeof accept === "string") return accept;

    if (typeof accept === "object" && accept !== null) {
      return Object.entries(accept)
        .map(([mime, exts]) => [mime, ...(exts || [])])
        .flat()
        .join(",");
    }

    return "*/*";
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
            <div className="flex items-center justify-center w-full h-full p-5 rounded border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
              {renderPreview()}
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
            <Icon icon={icon} className="h-12 w-12 text-primary" />
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
        accept={normalizeAccept(accept)}
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
