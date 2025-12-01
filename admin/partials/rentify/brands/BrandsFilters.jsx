"use client";
import React from "react";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import FilterForm from "./FilterForm";

const BrandFilters = () => {
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
              title: "Filter Brands",
              size: "xl",
              content: <FilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop Form */}
      <div className="hidden lg:block">
        <FilterForm />
      </div>
    </>
  );
};

export default BrandFilters;
