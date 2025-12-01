"use client";

import { createContext, useContext, useState } from "react";
import CommonModal from "@/components/CommonModal"; // Import your modal

const CommonModalContext = createContext();

export const CommonModalProvider = ({ children }) => {
  const [modalConfig, setCommonModalConfig] = useState({
    isOpen: false,
    title: "",
    content: null,
    className: "",
    showHeader: true,
  });

  const showCommonModal = (config) => {
    setCommonModalConfig({
      ...modalConfig,
      ...config,
      isOpen: true,
    });
  };

  const hideCommonModal = () => {
    setCommonModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <CommonModalContext.Provider value={{ showCommonModal, hideCommonModal }}>
      {children}
      <CommonModal {...modalConfig} onClose={hideCommonModal} />
    </CommonModalContext.Provider>
  );
};

export const useCommonModal = () => useContext(CommonModalContext);
