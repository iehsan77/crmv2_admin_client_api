"use client";
import { useEffect } from "react";
import { ListFilter } from "lucide-react";

import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";

import ViewsTabs from "@/partials/ViewsTabs";
import FiltersForm from "./FiltersForm";

import useLeadsStore, {
  useLeadsViewTabsStore,
} from "@/stores/crm/useLeadsStore";

const Filters = () => {
  const { showDrawer } = useDrawer();

  //const page = useLeadsStore((s) => s.page);
  //const setPage = useLeadsStore((s) => s.setPage);
  const fetchRecords = useLeadsStore((s) => s.fetchRecords);
  
  //useEffect(() => { fetchLeads(); }, [page]);

  return (
    <>
      {/* Tabs for switching views */}
      <ViewsTabs onTabChange={fetchRecords} useStore={useLeadsStore} viewsStore={useLeadsViewTabsStore} />

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
        <FiltersForm />
      </div>
    </>
  );
};

export default Filters;
