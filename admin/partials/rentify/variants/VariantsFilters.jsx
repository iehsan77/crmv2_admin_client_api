"use client";
import React from "react";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

import VariantFilterForm from "./VariantFilterForm";

const VariantFilters = () => {
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
              title: "Filter Variants",
              size: "xl",
              content: <VariantFilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop Form */}
      <div className="hidden lg:block">
        <VariantFilterForm />
      </div>
    </>
  );
};

export default VariantFilters;
