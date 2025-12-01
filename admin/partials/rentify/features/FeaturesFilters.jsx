"use client";
import React from "react";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

import FeatureFilterForm from "./FeatureFilterForm";

const FeatureFilters = () => {
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
              title: "Filter Features",
              size: "xl",
              content: <FeatureFilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop Form */}
      <div className="hidden lg:block">
        <FeatureFilterForm />
      </div>
    </>
  );
};

export default FeatureFilters;
