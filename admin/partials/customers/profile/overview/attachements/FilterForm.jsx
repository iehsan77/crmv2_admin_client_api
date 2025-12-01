"use client";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Search } from "lucide-react";
import { useDrawer } from "@/context/drawer-context";
import { useFiltersStore } from "@/stores/customers/useCustomerAttachementStore";
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
    { label: "Search", value: "search" },
    { label: "Attachement Name", value: "attachement_name" },
    { label: "Status", value: "status" },
    { label: "Attachment Date", value: "quote_date" },
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
      {/* Search Input Field */}
      {filterMapValues.includes("search") && (
        <div className="inline-flex items-center justify-start border-b">
          <input
            type="text"
            placeholder="Search quotes..."
            className="px-3 py-2 outline-none text-sm"
            value={values.search || ""}
            onChange={(e) => updateValue("search", e.target.value)}
          />
          <Search className="w-4 text-muted-foreground me-3" />
        </div>
      )}

      {/* Attachement Name Filter */}
      {filterMapValues.includes("attachement_name") && (
        <DropdownFilter
          label="Attachement Name"
          options={[
            { label: "Attachement 1", value: "attachement_1" },
            { label: "Attachement 2", value: "attachement_2" },
            { label: "Attachement 3", value: "attachement_3" },
            { label: "Attachement 4", value: "attachement_4" },
            { label: "Attachement 5", value: "attachement_5" },
          ]}
          value={values.attachement_name}
          onChange={(val) => updateValue("attachement_name", val)}
        />
      )}

      {/* Status Filter */}
      {filterMapValues.includes("status") && (
        <DropdownFilter
          label="Status"
          options={[
            { label: "Paid", value: "paid" },
            { label: "Pending", value: "pending" },
            { label: "Overdue", value: "overdue" },
            { label: "Draft", value: "draft" },
          ]}
          value={values.status}
          onChange={(val) => updateValue("status", val)}
        />
      )}

      {/* Attachment Date Filter */}
      {filterMapValues.includes("quote_date") && (
        <DropdownFilter
          label="Attachment Date"
          options={[
            { label: "Today", value: "today" },
            { label: "Last 7 Days", value: "last_7_days" },
            { label: "This Month", value: "this_month" },
            { label: "Last Month", value: "last_month" },
            { label: "Custom Range", value: "custom_range" },
          ]}
          value={values.quote_date}
          onChange={(val) => updateValue("quote_date", val)}
        />
      )}

      <div className="flex items-center gap-2 ml-auto">
        <Button size="lg" onClick={handleSearch}>
          Search
          <Search className="ml-1 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default FilterForm;
