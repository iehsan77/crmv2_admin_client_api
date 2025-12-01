"use client";

import { ListFilter } from "lucide-react";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
import BookingsViewsTabs from "./BookingsViewsTabs";
import BookingsFiltersForm from "./BookingsFiltersForm";

import {
  BOOKINGS_AVAILABLE_VIEWS,
  BOOKINGS_INITIAL_VIEWS,
} from "@/constants/rentify_constants";
import useBookingsStore from "@/stores/rentify/useBookingsStore";

import {
  useBookingsFiltersStore,
  useBookingsViewTabsStore,
} from "@/stores/rentify/useBookingsStore";

const BookingsFilters = () => {
  const { showDrawer } = useDrawer();
  const { activeTab } = useBookingsViewTabsStore();
  const { fetchBookings } = useBookingsStore();

  const { getPayload } = useBookingsFiltersStore();

  const loadDataByView = async () => {    
    await fetchBookings();
  };

  return (
    <>
      <BookingsViewsTabs
        availableTabs={BOOKINGS_AVAILABLE_VIEWS}
        initialTabs={BOOKINGS_INITIAL_VIEWS}
        onTabChange={loadDataByView}
      />

      {/* Mobile filter button */}
      <div className="block lg:hidden mb-2 text-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open filters"
          onClick={() =>
            showDrawer({
              title: "Filter Cars",
              size: "xl",
              content: <BookingsFiltersForm isDrawer />,
            })
          }
        >
          <ListFilter />
        </Button>
      </div>

      {/* Desktop form */}
      <div className="hidden lg:block">
        <BookingsFiltersForm />
      </div>
    </>
  );
};

export default BookingsFilters;
