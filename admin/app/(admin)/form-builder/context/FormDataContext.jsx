"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";

const FormDataContext = createContext();

export const FormDataProvider = ({ children }) => {
  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("formBuilderData");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync formData changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("formBuilderData", JSON.stringify(formData));
    }
  }, [formData]);

  const saveFormData = (data) => {
    setFormData(data);
  };

  // Memoize value to avoid unnecessary re-renders in consumers
  const contextValue = useMemo(() => ({ formData, saveFormData }), [formData]);

  return (
    <FormDataContext.Provider value={contextValue}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => useContext(FormDataContext);
