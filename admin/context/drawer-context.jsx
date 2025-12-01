"use client";
import Drawer from "@/components/Drawer";
import { createContext, useContext, useState } from "react";

const DrawerContext = createContext();

export const DrawerProvider = ({ children }) => {
  const [drawerStack, setDrawerStack] = useState([]);

  const showDrawer = (config) => {
    setDrawerStack((prev) => [
      ...prev,
      {
        isOpen: true,
        title: "",
        size: "md",
        content: null,
        showClose: true,
        footer: null,
        ...config,
      },
    ]);
  };

  const hideDrawer = () => {
    setDrawerStack((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        isOpen: false,
      };
      return updated;
    });

    setTimeout(() => {
      setDrawerStack((prev) => prev.slice(0, -1));
    }, 300);
  };

  return (
    <DrawerContext.Provider value={{ showDrawer, hideDrawer }}>
      {children}

      {/* Render all drawers in stack */}
      {drawerStack.map((drawerConfig, index) => (
        <Drawer
          key={index}
          {...drawerConfig}
          isOpen={drawerConfig.isOpen}
          onClose={hideDrawer}
          zIndex={1000 + index}
        />
      ))}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);
