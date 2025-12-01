"use client";
import React from "react";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

import ModelFilterForm from "./ModelFilterForm";

const ModelFilters = () => {
  const { showDrawer } = useDrawer();

  return (
    <>
      {/* Mobile Drawer */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            showDrawer({
              title: "Filter Models",
              size: "xl",
              content: <ModelFilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop Form */}
      <div className="hidden lg:block">
        <ModelFilterForm />
      </div>
    </>
  );
};

export default ModelFilters;
