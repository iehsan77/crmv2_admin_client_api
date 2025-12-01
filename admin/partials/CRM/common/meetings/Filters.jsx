"use client";
import { useEffect } from "react";
import { ListFilter } from "lucide-react";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

import FiltersForm from "@/partials/crm/accounts/FiltersForm";
const Filters = () => {
  const { showDrawer } = useDrawer();
  return (
    <div>
      {/* Mobile filter button */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open filters"
          title="Open filters"
          onClick={() =>
            showDrawer({
              title: "Filter Cars",
              size: "xl",
              content: <FiltersForm isDrawer />,
            })
          }
        >
          <ListFilter className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop filters form */}
      <div className="hidden lg:block">
        <FiltersForm showMoreButton={false} />
      </div>
    </div>
  );
};

export default Filters;
