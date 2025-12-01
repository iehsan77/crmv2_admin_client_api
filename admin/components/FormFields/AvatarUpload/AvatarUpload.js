"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import ImageEditorModal from "./ImageEditorModal"; // Ensure this path is correct

import toast from "react-hot-toast";

export default function AvatarUpload({
  label = "Profile Picture",
  icon = "mdi:account-circle",
  error,
  helperText = "",
  tooltip,
  disabled,
  value = null,
  onChange,
  maxSize = 4 * 1024 * 1024, // 2MB
  setError,
  name,
  accept = "image/*",
  id,
  size = "lg", // 'sm', 'md', 'lg'
  shape = "circle", // 'circle' or 'square'
  showEditButton = true,
  ...props
}) {
  const inputId = id || `avatar-upload-${Math.random().toString(36)}`;
  const [file, setFile] = useState(value);
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const sizeConfig = {
    sm: { container: 80, icon: 24 },
    md: { container: 120, icon: 32 },
    lg: { container: 160, icon: 40 },
  };

  const currentSize = sizeConfig[size] || sizeConfig.lg;

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
      toast.error(msg);
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

  const handleEdit = () => {
    if (file) setIsEditorOpen(true);
  };

  const handleEditorSave = (editedImageBlob) => {
    const newFile = new File([editedImageBlob], "edited-avatar.jpg", {
      type: "image/jpeg",
    });
    setFile(newFile);
    onChange?.(newFile);
    setIsEditorOpen(false);
  };

  const imageSrc =
    typeof file === "string" ? file : file ? URL.createObjectURL(file) : null;

  return (
    <div className="w-full mx-auto">
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

      <div className="flex flex-col items-start gap-3">
        <div className="relative group mx-auto">
          {file ? (
            <>
              <div
                className={`overflow-hidden ${
                  shape === "circle" ? "rounded-full" : "rounded-lg"
                } border border-gray-300`}
                style={{
                  width: currentSize.container,
                  height: currentSize.container,
                }}
              >
                <Image
                  src={imageSrc}
                  alt="avatar preview"
                  width={currentSize.container}
                  height={currentSize.container}
                  className="w-full h-full object-cover"
                />
              </div>
              {showEditButton && !disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Change photo"
                  >
                    <Icon icon="mdi:camera" className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="absolute bottom-0 left-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Edit photo"
                  >
                    <Icon icon="mdi:pencil" className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                    title="Remove photo"
                  >
                    <Icon icon="mdi:close" className="w-3 h-3" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div
              onClick={() => !disabled && fileInputRef.current.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed ${
                shape === "circle" ? "rounded-full" : "rounded-lg"
              } cursor-pointer ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : dragActive
                  ? "!border-primary !bg-primary/10"
                  : "hover:border-gray-400"
              } transition-all border-gray-300 bg-gray-50`}
              style={{
                width: currentSize.container,
                height: currentSize.container,
              }}
            >
              <Icon
                icon={icon}
                className="text-gray-400"
                style={{
                  width: currentSize.icon,
                  height: currentSize.icon,
                }}
              />
            </div>
          )}
        </div>

        {!file && (
          <div className="flex flex-col gap-1 mx-auto">
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current.click()}
              className={`text-xs ${
                disabled ? "text-gray-400" : "text-[#1E3A8A] hover:text-blue-800"
              } font-medium`}
              disabled={disabled}
            >
              Upload photo
            </button>
            <span className="text-xs text-gray-500">
              {dragActive ? "Drop photo here" : "or drag and drop"}
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

      <ImageEditorModal
        open={isEditorOpen}
        imageSrc={imageSrc}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleEditorSave}
      />
    </div>
  );
}



// "use client";
// import { Icon } from "@iconify/react";
// import Image from "next/image";
// import { useRef, useState, useEffect } from "react";

// export default function AvatarUpload({
//   label = "Profile Picture",
//   icon = "mdi:account-circle",
//   error,
//   helperText = "",
//   tooltip,
//   disabled,
//   value = null,
//   onChange,
//   maxSize = 2 * 1024 * 1024, // 2MB (smaller for avatars)
//   setError,
//   name,
//   accept = "image/*",
//   id,
//   size = "lg", // 'sm', 'md', 'lg'
//   shape = "circle", // 'circle' or 'square'
//   showEditButton = true,
//   ...props
// }) {
//   const inputId = id || `avatar-upload-${Math.random().toString(36)}`;
//   const [file, setFile] = useState(value);
//   const fileInputRef = useRef();
//   const [dragActive, setDragActive] = useState(false);

//   // Size configurations
//   const sizeConfig = {
//     sm: { container: 80, icon: 24 },
//     md: { container: 120, icon: 32 },
//     lg: { container: 160, icon: 40 },
//   };

//   const currentSize = sizeConfig[size] || sizeConfig.lg;

//   useEffect(() => {
//     if (value !== file) {
//       setFile(value);
//     }
//   }, [value]);

//   const clearError = () => {
//     if (setError && name) setError(name, { message: "" });
//   };

//   const validateFile = (file) => {
//     clearError();

//     if (!file.type.match("image.*")) {
//       const msg = "Only image files are allowed";
//       setError?.(name, { type: "validate", message: msg });
//       return { valid: false, error: msg };
//     }

//     if (file.size > maxSize) {
//       const msg = `Max file size is ${maxSize / 1024 / 1024}MB`;
//       setError?.(name, { type: "validate", message: msg });
//       return { valid: false, error: msg };
//     }

//     return { valid: true };
//   };

//   const handleFileChange = (e) => {
//     const selected = e.target.files?.[0];
//     if (!selected) return;

//     const { valid } = validateFile(selected);
//     if (!valid) return;

//     setFile(selected);
//     onChange?.(selected);
//   };

//   const handleRemove = () => {
//     setFile(null);
//     onChange?.(null);
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     const droppedFile = e.dataTransfer.files?.[0];
//     if (!droppedFile) return;

//     const { valid } = validateFile(droppedFile);
//     if (!valid) return;

//     setFile(droppedFile);
//     onChange?.(droppedFile);
//   };

//   return (
//     <div className="w-full mx-auto">
//       {label && (
//         <label
//           htmlFor={inputId}
//           className={`block text-sm mb-1 ${
//             error ? "text-red-500" : "text-gray-dark"
//           }`}
//         >
//           {label}
//         </label>
//       )}

//       <div className="flex flex-col items-start gap-3">
//         <div className="relative group mx-auto">
//           {file ? (
//             <>
//               <div
//                 className={`overflow-hidden ${
//                   shape === "circle" ? "rounded-full" : "rounded-lg"
//                 } border border-gray-300`}
//                 style={{
//                   width: currentSize.container,
//                   height: currentSize.container,
//                 }}
//               >
//                 <Image
//                   src={
//                     typeof file === "string" ? file : URL.createObjectURL(file)
//                   }
//                   alt="avatar preview"
//                   width={currentSize.container}
//                   height={currentSize.container}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               {showEditButton && !disabled && (
//                 <>
//                   <button
//                     type="button"
//                     onClick={() => fileInputRef.current.click()}
//                     className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
//                     title="Change photo"
//                   >
//                     <Icon icon="mdi:camera" className="w-4 h-4 text-gray-600" />
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleRemove}
//                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                     disabled={disabled}
//                     title="Remove photo"
//                   >
//                     <Icon icon="mdi:close" className="w-3 h-3" />
//                   </button>
//                 </>
//               )}
//             </>
//           ) : (
//             <div
//               onClick={() => !disabled && fileInputRef.current.click()}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//               className={`flex flex-col items-center justify-center border-2 border-dashed ${
//                 shape === "circle" ? "rounded-full" : "rounded-lg"
//               } cursor-pointer ${
//                 disabled
//                   ? "opacity-50 cursor-not-allowed"
//                   : dragActive
//                   ? "border-blue-400 bg-blue-50"
//                   : "hover:border-gray-400"
//               } transition-all border-gray-300 bg-gray-50`}
//               style={{
//                 width: currentSize.container,
//                 height: currentSize.container,
//               }}
//             >
//               <Icon
//                 icon={icon}
//                 className="text-gray-400"
//                 style={{
//                   width: currentSize.icon,
//                   height: currentSize.icon,
//                 }}
//               />
//             </div>
//           )}
//         </div>

//         {!file && (
//           <div className="flex flex-col gap-1 mx-auto">
//             <button
//               type="button"
//               onClick={() => !disabled && fileInputRef.current.click()}
//               className={`text-xs ${
//                 disabled ? "text-gray-400" : "text-blue-600 hover:text-blue-800"
//               } font-medium`}
//               disabled={disabled}
//             >
//               Upload photo
//             </button>
//             <span className="text-xs text-gray-500">
//               {dragActive ? "Drop photo here" : "or drag and drop"}
//             </span>
//           </div>
//         )}
//       </div>

//       <input
//         id={inputId}
//         ref={fileInputRef}
//         type="file"
//         accept={accept}
//         onChange={handleFileChange}
//         className="hidden"
//         disabled={disabled}
//         {...props}
//       />

//       {helperText && !error && (
//         <div className="text-xs text-gray-500 mt-1">{helperText}</div>
//       )}
//       {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
//       {tooltip && (
//         <div className="flex items-center mt-1 text-gray-400">
//           <Icon icon="mdi:information" className="h-3 w-3 mr-1" />
//           <span className="text-xs">{tooltip}</span>
//         </div>
//       )}
//     </div>
//   );
// }
