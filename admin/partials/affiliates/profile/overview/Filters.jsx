"use client";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import TabsCRUD from "./TabsCRUD";
import FilterForm from "./FilterForm";

const Filters = () => {
  const { showDrawer } = useDrawer();

  const handleFilters = (data) => {
    console.log("Applied Filters:", data);
  };

  return (
    <>
      <TabsCRUD
        availableTabs={[
          {
            title: "General",
            options: [{ label: "Vehicle List", value: "vehicle_list" }],
          },
        ]}
        initialTabs={[{ label: "Vehicle List", value: "vehicle_list" }]}
        onTabChange={(key) => console.log("Active Tab:", key)}
        showAddView={false}
      />

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
