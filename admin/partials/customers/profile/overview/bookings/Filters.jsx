"use client";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import FilterForm from "./FilterForm";

const Filters = () => {
  const { showDrawer } = useDrawer();

  return (
    <>
      {/* Mobile filter button */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            showDrawer({
              title: "Filter Cars",
              size: "xl",
              content: <FilterForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop form */}
      <div className="hidden lg:block">
        <FilterForm />
      </div>
    </>
  );
};

export default Filters;
