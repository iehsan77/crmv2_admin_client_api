"use client";

import { createContext, useContext, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [modalConfig, setModalConfig] = useState({
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

  const showModal = (config) => {
    setModalConfig({
      ...modalConfig,
      ...config,
      isOpen: true,
    });
  };

  const hideModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider
      value={{ showModal, hideModal, isConfirming, setIsConfirming }}
    >
      {children}
      <ConfirmationModal
        {...modalConfig}
        onClose={hideModal}
        isSubmitting={isConfirming}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);