"use client";
import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import AffiliatesViewsTabs from "@/partials/affiliates/AffiliatesViewsTabs";
import AffiliatesFiltersForm from "@/partials/affiliates/AffiliatesFiltersForm";

import {
  AFFILIATE_AVAILABLE_VIEWS,
  AFFILIATE_INITIAL_VIEWS,
} from "@/constants/rentify_constants";

import useAffiliatesStore from "@/stores/rentify/affiliates/useAffiliatesStore";

const AffiliatesFilters = () => {
  const { showDrawer } = useDrawer();

  const { fetchAffiliates } = useAffiliatesStore();

  const loadDataByView = async (view) => {  
    const body={
      view:view,
    }
    await fetchAffiliates(body);
  };


  return (
    <>
      <AffiliatesViewsTabs
        availableTabs={AFFILIATE_AVAILABLE_VIEWS}
        initialTabs={AFFILIATE_INITIAL_VIEWS}
        onTabChange={(view) => loadDataByView(view)}
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
              content: <AffiliatesFiltersForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop form */}
      <div className="hidden lg:block">
        <AffiliatesFiltersForm />
      </div>
    </>
  );
};

export default AffiliatesFilters;
