"use client";
import {
  FaRegFileExcel,
  FaRegFilePdf,
  FaRegFileWord,
  FaRegFileAlt,
} from "react-icons/fa";

import { usePathname } from "next/navigation";

import Link from "next/link";

import { NOIMAGE } from "@/constants/general_constants";
import useUserStore from "@/stores/useUserStore"; // ✅ ensure named import if that's how you export it

// ✅ Slugify
export const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

// ✅ Safe Image
export const getImageUrl = (url) => {
  const isValidImage =
    typeof url === "string" && /\.(jpe?g|gif|png|webp|svg)$/i.test(url);
  return isValidImage ? url : NOIMAGE;
};

// ✅ Random String
export const getRandomString = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

// ✅ Dropdown Format
/*
export const getDropdownFormattedData = (data) =>
  Array.isArray(data)
    ? data.map(({ id, title }) => ({
        value: String(id),
        label: String(title),
      }))
    : [];
    */
export const getDropdownFormattedData = (data, excludeIds = []) => {
  // Ensure excludeIds is always an array
  const excluded = Array.isArray(excludeIds)
    ? excludeIds.map(String)
    : [String(excludeIds)];

  return Array.isArray(data)
    ? data
        .filter((item) => !excluded.includes(String(item.id)))
        .map(({ id, title }) => ({
          value: String(id),
          label: String(title),
        }))
    : [];
};

// ✅ Random Number
export const getRandomNumber = (min = 1, max = 100000000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ✅ Custom hook wrapper for user info (hook safe)
export const useUserInfo = (key = "") => {
  const { user } = useUserStore();
  if (!key || typeof user !== "object" || user === null) return "";
  return user[key] ?? "";
};

// ✅ Date formatter
/*
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date) ? "" : date.toLocaleString();
};
*/
export const formatDateTime = (dateString, format = "dd-MMM-yyyy hh-mm-a") => {
  /*

formatDateTime("2025-10-10T14:45:00Z");
// → "10-10-2025"

formatDateTime("2025-10-10T14:45:00Z", "dd/MM/yyyy hh:mm a");
// → "10/10/2025 07:45 PM"  (depends on local timezone)

formatDateTime("2025-10-10T02:30:00Z", "dd-MM-yyyy hh:mm a");
// → "10-10-2025 07:30 AM"

formatDateTime("2025-10-10T14:45:00Z", "HH:mm:ss a");
// → "19:45:00 PM" (24h + AM/PM — valid but redundant)

*/

  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date)) return "";

  const pad = (num) => String(num).padStart(2, "0");

  const monthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthsLong = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 >= 12 ? "PM" : "AM";

  const map = {
    MMMM: monthsLong[date.getMonth()],
    MMM: monthsShort[date.getMonth()],
    yyyy: date.getFullYear(),
    yy: String(date.getFullYear()).slice(-2),
    dd: pad(date.getDate()),
    d: date.getDate(),
    HH: pad(hours24),
    hh: pad(hours12),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    a: ampm,
  };

  // Sort tokens by length (to avoid partial replacements)
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);

  let formatted = format;
  for (const token of tokens) {
    formatted = formatted.replace(token, map[token]);
  }

  return formatted;
};

export function formatDate(dateInput, format = "dd-MM-yyyy") {
  if (!dateInput) return "-";

  const date = new Date(dateInput);
  if (isNaN(date)) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const monthNum = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const monthShort = date.toLocaleString("en-US", { month: "short" }); // e.g. "Sep"

  return format
    .replace("dd", day)
    .replace("MMM", monthNum)
    .replace("MM", monthShort)
    .replace("yyyy", year);
}

// ✅ Industry name formatter
export const formatIndustryName = (industry) =>
  industry
    ? industry
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" & ")
    : "";

// ✅ JSON parser
export const tryParseJSON = (json) => {
  try {
    return typeof json === "string" ? JSON.parse(json) : json;
  } catch {
    return {};
  }
};

// ✅ File icon
export const getFileIcon = (ext) => {
  if (["xls", "xlsx"].includes(ext))
    return <FaRegFileExcel size={36} className="text-green-600" />;
  if (["pdf"].includes(ext))
    return <FaRegFilePdf size={36} className="text-red-600" />;
  if (["doc", "docx"].includes(ext))
    return <FaRegFileWord size={36} className="text-[#1E3A8A]" />;
  return <FaRegFileAlt size={36} className="text-gray-600" />;
};


export const getthiFileIcon = (ext = "") => {
  const fileType = ext.toLowerCase().replace(".", ""); // clean input

  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(fileType))
    return "ph:image";

  if (fileType === "pdf") return "ph:file-pdf";

  if (["doc", "docx"].includes(fileType)) return "ph:file-doc";

  if (["xls", "xlsx", "csv"].includes(fileType)) return "ph:file-xls";

  if (["zip", "rar", "7z"].includes(fileType)) return "ph:file-zip";

  if (["mp4", "mov", "avi", "mkv"].includes(fileType)) return "ph:video";

  if (["mp3", "wav", "ogg"].includes(fileType)) return "ph:music-note";

  if (["txt", "json", "md", "log"].includes(fileType)) return "ph:file-text";

  return "ph:file"; // default icon
};


// ✅ File size converter
export const convertToKB = (sizeInBytes = 0) =>
  sizeInBytes ? `${(sizeInBytes / 1024).toFixed(2)} KB` : "";

export const getKeyFromData = (data = [], key = "", valueField = "label") => {
  if (data.length < 1 || key === "") return "";
  const found = data.find((item) => Number(item.value) === Number(key));
  return found ? found[valueField] ?? "" : "";
};

export const getMocDataLabelByValue = (
  data = [],
  value = "",
  valueField = "label"
) => {
  if (data.length < 1 || value === "") return "";
  const found = data.find((item) => String(item.value) === String(value));
  return found ? found[valueField] ?? "" : "";
};

export const getKeysObject = (object, initialValue = "") => {
  return object
    .flatMap((group) => group.options)
    .reduce((acc, option) => {
      acc[option.value] = initialValue;
      return acc;
    }, {});
};

/* ✅ Reusable sub-components */
export const InfoItem = ({ label, value }) => (
  <span className="me-2">
    <strong className="me-2">{label}:</strong> {value || "-"}
  </span>
);

export const IconItem = ({ icon: Icon, label, value }) => (
  <span className="flex items-center me-2">
    <Icon className="h-4 w-4 me-2 text-gray-500" />
    <strong className="me-2">{label}:</strong> {value || "-"}
  </span>
);

export const getName = (obj) =>
  obj ? `${obj?.first_name ?? ""} ${obj?.last_name ?? ""}`.trim() : "-";

export function useSegment(seg) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (seg === undefined || seg === null) return null;
  return segments[seg] || null;
}

export function normalizeAllFilters(filterFormValues = {}) {
  // ✅ Guard clause: skip if object is empty or falsy
  //if (!filterFormValues || Object.keys(filterFormValues).length === 0) { return {}; }

  return Object.keys(filterFormValues).reduce((acc, key) => {
    const val = filterFormValues[key];

    // Skip null, undefined, or empty string values
    if (val === null || val === undefined || val === "") return acc;

    if (val && typeof val === "object" && "value" in val) {
      acc[key] = val.value;
    } else if (Array.isArray(val)) {
      const mapped = val
        .map((item) =>
          typeof item === "object" && "value" in item ? item.value : item
        )
        .filter((v) => v !== null && v !== undefined && v !== ""); // clean empty array items

      if (mapped.length > 0) acc[key] = mapped;
    } else {
      acc[key] = val;
    }

    return acc;
  }, {});
}


export function DocItem({ label, docs }) {
  return (
    <div>
      <p className="font-medium text-primary">{label}:</p>
      {docs?.length > 0 ? (
        docs.map((doc, i) =>
          doc.url ? (
            <Link
              key={i}
              href={doc.url}
              target="_blank"
              className="text-green-600 underline text-[12px] me-2"
            >
              View
            </Link>
          ) : (
            <span key={i}>-</span>
          )
        )
      ) : (
        <p>-</p>
      )}
    </div>
  );
}


