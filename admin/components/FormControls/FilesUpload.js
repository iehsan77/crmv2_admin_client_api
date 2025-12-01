"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useState, useEffect } from "react";
import Image from "next/image";

import {
  FaCloudUploadAlt,
  FaRegTrashAlt,
  FaRegFileExcel,
  FaRegFilePdf,
  FaRegFileWord,
  FaRegFileAlt,
  FaFileImage,
} from "react-icons/fa";

export default function FilesUpload({
  name,
  className = "",
  inputClass = "",
  title,
  validation,
  placeholder = "an image or document",
  accept,
  titleClassName = "",
  ...other
}) {
  const { control, setError, getValues, setValue } = useFormContext();
  const [filePreviews, setFilePreviews] = useState([]);

  useEffect(() => {
    const existingFiles = getValues(`old_${name}`);
    if (Array.isArray(existingFiles)) {
      setFilePreviews(existingFiles.map(file => ({ file, url: file })));
    }
  }, [getValues, name]);

  const getFileIcon = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();

    if (file.type.startsWith("image/")) return <FaFileImage size={20} />;
    if (["xls", "xlsx"].includes(ext)) return <FaRegFileExcel size={20} className="text-green-600" />;
    if (["pdf"].includes(ext)) return <FaRegFilePdf size={20} className="text-red-600" />;
    if (["doc", "docx"].includes(ext)) return <FaRegFileWord size={20} className="text-[#1E3A8A]" />;
    return <FaRegFileAlt size={20} />;
  };

  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError(name, { message: `Only ${placeholder} files are allowed.` });
      return;
    }

    const newPreviews = acceptedFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      return { file, url: objectUrl };
    });

    const allFiles = [...filePreviews, ...newPreviews];
    setFilePreviews(allFiles);
    setValue(name, allFiles.map(({ file }) => file));
    setError(name, null);
  };

  const removeFile = (index) => {
    const updated = [...filePreviews];
    const removed = updated.splice(index, 1);
    setFilePreviews(updated);
    setValue(name, updated.map(({ file }) => file));
    URL.revokeObjectURL(removed[0].url);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept,
    ...other,
  });

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ fieldState: { error } }) => (
        <div className={`${className} flex flex-col h-full`}>
          {title && (
            <div className="label">
              <span className={`${titleClassName} label-text`}>{title}</span>
            </div>
          )}

          {/* Upload Drop Area */}
          <div
            {...getRootProps({
              className: `relative h-full text-sm font-medium text-left w-full flex flex-col items-center justify-center border border-dashed mt-1 !border-base-content !border-opacity-10 rounded-xl bg-transparent shadow-sm px-4 py-2 cursor-pointer focus-within:ring-secondary focus-within:border-secondary ${
                isDragActive ? "bg-blue-100 border-blue-400" : ""
              }`,
            })}
          >
            <input
              {...getInputProps({
                className: `form-file ${inputClass} sr-only`,
              })}
            />

            <div className="flex flex-col items-center">
              <FaCloudUploadAlt />
              <div className="text-center">
                <p>Drag and drop files here</p>
                <p className="text-xs">{placeholder}</p>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {filePreviews.map((preview, idx) => {
                const isImage = preview.file.type.startsWith("image/");
                return (
                  <div
                    key={idx}
                    className="relative border rounded p-2 flex flex-col items-center"
                  >
                    {/* Delete Icon */}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-white text-red-500 hover:bg-red-100 p-1 rounded-full"
                      title="Remove"
                    >
                      <FaRegTrashAlt size={12} />
                    </button>

                    {/* Image Preview or File Icon */}
                    <div className="relative w-[60px] h-[60px] flex items-center justify-center">
                      {isImage ? (
                        <Image
                          src={preview.url}
                          alt={`Preview ${idx}`}
                          fill
                          className="object-contain rounded"
                        />
                      ) : (
                        getFileIcon(preview.file)
                      )}
                    </div>

                    {/* Tooltip under preview */}
                    <div
                      className="text-xs mt-2 text-center truncate max-w-[80px]"
                      title={preview.file.name}
                    >
                      {preview.file.name.length > 15
                        ? preview.file.name.slice(0, 12) + "..."
                        : preview.file.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {error?.message && (
            <p className="text-xs text-red-500 mt-1">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}

FilesUpload.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  inputClass: PropTypes.string,
  title: PropTypes.string,
  validation: PropTypes.shape({
    maxWidth: PropTypes.number,
    maxHeight: PropTypes.number,
    aspectRatio: PropTypes.number,
  }),
  placeholder: PropTypes.string,
  accept: PropTypes.string,
  titleClassName: PropTypes.string,
};
