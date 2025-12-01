"use client";

import PropTypes from "prop-types";
import { useFormContext, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useState, useEffect } from "react";
import Image from "next/image"; // Standard name is just `Image`

import { FaCloudUploadAlt, FaRegTrashAlt } from "react-icons/fa";

export default function FileUpload({
  name,
  className = "",
  inputClass = "",
  title,
  validation,
  placeholder = "an image file",
  accept,
  titleClassName = "",
  ...other
}) {
  const { control, setError, getValues, setValue } = useFormContext();

  const [filePreview, setFilePreview] = useState(
    getValues(`old_${name}`) || null
  );
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(null);

  useEffect(() => {
    const initialPreview = getValues(`old_${name}`);
    if (initialPreview && typeof initialPreview === "string") {
      setFilePreview(initialPreview);
    }
  }, [getValues, name]);

  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length > 0) {
      validateFileDimensions(acceptedFiles[0]);
    } else if (rejectedFiles.length > 0) {
      setError(name, { message: `Only ${placeholder} is allowed.` });
      resetFileState();
    }
  };

  const validateFileDimensions = (file) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const { width, height } = img;
      const { maxWidth, maxHeight, aspectRatio } = validation || {};
      const actualAspectRatio = width / height;

      const isWidthValid = !maxWidth || width <= maxWidth;
      const isHeightValid = !maxHeight || height <= maxHeight;
      const isAspectRatioValid =
        !aspectRatio || Math.abs(actualAspectRatio - aspectRatio) < 0.01;

      if (isWidthValid && isHeightValid && isAspectRatioValid) {
        setFileState(file, objectUrl);
      } else {
        setError(name, {
          message: aspectRatio
            ? `${placeholder} should have an aspect ratio of ${aspectRatio}:1.`
            : `${placeholder} should be within ${maxWidth}x${maxHeight} pixels.`,
        });
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      setError(name, { message: "Failed to load the image for validation." });
      resetFileState();
      URL.revokeObjectURL(objectUrl);
    };
  };

  const setFileState = (file, objectUrl) => {
    setValue(name, file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + " KB");
    setError(name, null);

    if (file.type.startsWith("image/")) {
      setFilePreview(objectUrl);
    } else {
      setFilePreview(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const resetFileState = () => {
    setValue(name, null);
    setValue(`old_${name}`, "");
    setFileName(null);
    setFilePreview(null);
    setFileSize(null);
    setError(name, null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept,
    ...other,
  });

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ fieldState: { error } }) => (
        <div className={`${className} flex flex-col h-full`}>
          {title && (
            <div className="label">
              <span className={`${titleClassName} label-text`}>{title}</span>
            </div>
          )}

          <div
            {...getRootProps({
              className: `relative h-full text-sm font-medium text-left w-full flex flex-col items-center justify-center border border-dashed mt-1 !border-base-content !border-opacity-10 rounded-xl bg-transparent shadow-sm px-4 py-2 cursor-pointer focus-within:ring-secondary focus-within:border-secondary ${
                isDragActive ? "bg-blue-100 border-blue-400" : ""
              }`,
            })}
          >
            {filePreview && (
              <button
                type="button"
                className="absolute top-2 right-2 text-xs rounded-full bg-white border hover:bg-red-100 text-red-500 p-2 z-[999]"
                onClick={resetFileState}
              >
                <FaRegTrashAlt />
              </button>
            )}

            <input
              {...getInputProps({
                className: `form-file ${inputClass} sr-only`,
              })}
            />

            {filePreview ? (
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36">
                  <Image
                    src={filePreview}
                    alt="File Preview"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
                <div className="pb-3 mt-2 text-center">
                  {fileName && <p>{fileName}</p>}
                  {fileSize && <p className="text-xs">{fileSize}</p>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FaCloudUploadAlt />
                <div className="text-center">
                  <p>Drag and drop file here</p>
                  <p className="text-xs">{placeholder}</p>
                </div>
              </div>
            )}
          </div>

          {error?.message && (
            <p className="text-xs text-red-500">{error.message}</p>
          )}
        </div>
      )}
    />
  );
}

FileUpload.propTypes = {
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
