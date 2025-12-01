"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import "react-quill/dist/quill.snow.css"; // ✅ Correct style import

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false }); // ✅ Correct import

const TextEditorControl = ({ defaultValue, getData, options, size }) => {
  const [value, setValue] = useState("");

  const modules = {
    toolbar: [
      [{ header: ["2", "3", "4", "5", "6"] }, { font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "background",
    "bold",
    "color",
    "font",
    "code",
    "italic",
    "link",
    "size",
    "strike",
    "script",
    "underline",
    "blockquote",
    "header",
    "indent",
    "list",
    "align",
    "direction",
    "code-block",
    "formula",
    "image",
    "video",
  ];

  const handleChange = (content) => {
    setValue(content);
    getData(content);
  };

  return (
    <ReactQuill
      value={defaultValue || value}
      onChange={handleChange}
      modules={options || modules}
      formats={formats}
      style={{ height: size }}
      className="mb-[5rem]"
    />
  );
};

export default TextEditorControl;
