"use client";
import DateInput from "@/components/fields/DateInput";
import TextareaInput from "@/components/fields/TextareaInput";
import TextInput from "@/components/fields/TextInput";

export const getFieldComponent = (type) => {
  switch (type) {
    case "SingleLine":
      return TextInput;
    case "MultiLine":
      return TextareaInput;
    case "Date":
      return DateInput;
    default:
      return null;
  }
};
