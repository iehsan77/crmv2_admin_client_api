"use client";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Search } from "lucide-react";
import { useDrawer } from "@/context/drawer-context";
import { useFiltersStore } from "@/stores/customers/useCustomerBookingStore";
import { useEffect } from "react";

const FilterForm = ({ isDrawer = false }) => {
  const { hideDrawer } = useDrawer();
  const {
    filters,
    setFilters,
    setActiveFilter,
    updateValue,
    values,
    getPayload,
  } = useFiltersStore();

  // --- Initial Filters ---
  const initialFilters = [
    { label: "Booking ID", value: "booking_id" },
    { label: "Client", value: "client" },
    { label: "Vehicle", value: "vehicle" },
    { label: "Booking Status", value: "booking_status" },
    { label: "Booking Date", value: "booking_date" },
    { label: "Last Activity", value: "last_activity" },
  ];

  useEffect(() => {
    if (filters.length === 0) {
      setFilters(initialFilters);
      setActiveFilter(initialFilters[0].value);
    }
  }, []);

  const filterMapValues = filters.map((f) => f.value);

  const handleSearch = () => {
    console.log("Applied Filters Payload:", getPayload());
    if (isDrawer) hideDrawer();
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 py-2 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("booking_id") && (
        <DropdownFilter
          label="Booking ID"
          options={[
            { label: "BKG-1001", value: "bkg_1001" },
            { label: "BKG-1002", value: "bkg_1002" },
          ]}
          value={values.booking_id}
          onChange={(val) => updateValue("booking_id", val)}
        />
      )}

      {filterMapValues.includes("client") && (
        <DropdownFilter
          label="Client"
          options={[
            { label: "John Doe", value: "john_doe" },
            { label: "Jane Smith", value: "jane_smith" },
          ]}
          value={values.client}
          onChange={(val) => updateValue("client", val)}
        />
      )}

      {filterMapValues.includes("vehicle") && (
        <DropdownFilter
          label="Vehicle"
          options={[
            { label: "Toyota Camry", value: "toyota_camry" },
            { label: "Honda Accord", value: "honda_accord" },
          ]}
          value={values.vehicle}
          onChange={(val) => updateValue("vehicle", val)}
        />
      )}

      {filterMapValues.includes("booking_status") && (
        <DropdownFilter
          label="Booking Status"
          options={[
            { label: "Confirmed", value: "confirmed" },
            { label: "Pending", value: "pending" },
            { label: "Cancelled", value: "cancelled" },
          ]}
          value={values.booking_status}
          onChange={(val) => updateValue("booking_status", val)}
        />
      )}

      {filterMapValues.includes("booking_date") && (
        <DropdownFilter
          label="Booking Date"
          options={[
            { label: "2025-09-01", value: "2025-09-01" },
            { label: "2025-09-02", value: "2025-09-02" },
          ]}
          value={values.booking_date}
          onChange={(val) => updateValue("booking_date", val)}
        />
      )}

      {filterMapValues.includes("last_activity") && (
        <DropdownFilter
          label="Last Activity"
          options={[
            { label: "Last 24 hours", value: "last_24_hours" },
            { label: "Last 7 days", value: "last_7_days" },
            { label: "Last 30 days", value: "last_30_days" },
          ]}
          value={values.last_activity}
          onChange={(val) => updateValue("last_activity", val)}
        />
      )}

      {/* Search Button */}

      <div className="flex items-center gap-2 ml-auto">
        <Button size="lg" onClick={handleSearch}>
          Search
          <Search />
        </Button>
      </div>
    </div>
  );
};

export default FilterForm;
