"use client";

import { createContext, useContext, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";

const ConfirmModalContext = createContext();

export const ConfirmModalProvider = ({ children }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    icon: "mdi:alert",
    iconColor: "text-red-500",
    type: "default",
    onConfirm: () => {},
    isSubmitting: false,
    row: null,
  });

  const showConfirmModal = (config) => {
    setConfirmModalConfig({
      ...confirmModalConfig,
      ...config,
      isOpen: true,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmModalContext.Provider
      value={{
        showConfirmModal,
        hideConfirmModal,
        isConfirming,
        setIsConfirming,
      }}
    >
      {children}
      <ConfirmationModal
        {...confirmModalConfig}
        onClose={hideConfirmModal}
        isSubmitting={isConfirming}
      />
    </ConfirmModalContext.Provider>
  );
};

export const useConfirmModal = () => useContext(ConfirmModalContext);
