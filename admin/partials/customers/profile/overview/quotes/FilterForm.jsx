"use client";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Search } from "lucide-react";
import { useDrawer } from "@/context/drawer-context";
import { useFiltersStore } from "@/stores/customers/useCustomerQuoteStore";
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
    { label: "Customer Name", value: "customer_name" },
    { label: "Status", value: "status" },
    { label: "Quote Date", value: "quote_date" },
    { label: "Quote Due Date", value: "quote_due_date" },
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

      {/* Customer Name Filter */}
      {filterMapValues.includes("customer_name") && (
        <DropdownFilter
          label="Customer Name"
          options={[
            { label: "Customer 1", value: "customer_1" },
            { label: "Customer 2", value: "customer_2" },
            { label: "Customer 3", value: "customer_3" },
            { label: "Customer 4", value: "customer_4" },
            { label: "Customer 5", value: "customer_5" },
          ]}
          value={values.customer_name}
          onChange={(val) => updateValue("customer_name", val)}
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

      {/* Quote Date Filter */}
      {filterMapValues.includes("quote_date") && (
        <DropdownFilter
          label="Quote Date"
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

      {/* Quote Due Date Filter */}
      {filterMapValues.includes("quote_due_date") && (
        <DropdownFilter
          label="Quote Due Date"
          options={[
            { label: "Today", value: "today" },
            { label: "Next 7 Days", value: "next_7_days" },
            { label: "Next 30 Days", value: "next_30_days" },
            { label: "Overdue", value: "overdue" },
            { label: "Custom Range", value: "custom_range" },
          ]}
          value={values.quote_due_date}
          onChange={(val) => updateValue("quote_due_date", val)}
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
