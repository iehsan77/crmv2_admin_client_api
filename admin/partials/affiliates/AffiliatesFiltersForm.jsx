"use client";
import DropdownFilter from "@/components/DropdownFilter";
import Button from "@/components/Button";
import { Menu, Search } from "lucide-react";
import { useDrawer } from "@/context/drawer-context";
import { useFiltersStore } from "@/stores/rentify/affiliates/useAffiliatesStore";
import { useEffect } from "react";
import CheckboxInput from "@/components/FormFields/CheckboxInput";

import useAffiliatesStore, {
  useViewTabsStore,
} from "@/stores/rentify/affiliates/useAffiliatesStore";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const AffiliatesFiltersForm = ({ isDrawer = false }) => {
  const { fetchAffiliates } = useAffiliatesStore();

  const { hideDrawer, showDrawer } = useDrawer();
  const {
    filters,
    setFilters,
    setActiveFilter,
    updateValue,
    values,
    getPayload,
  } = useFiltersStore();
  const { activeTab } = useViewTabsStore();

  const availableFilters = [
    {
      title: "Basic Info",
      options: [
        { label: "Search", value: "search" },
        { label: "No of Vehicles Affiliate", value: "vehicles" },
        { label: "Active Status", value: "active" },
      ],
    },
  ];

  const initialFilters = [{ label: "Search", value: "search" }];

  useEffect(() => {
    if (filters.length === 0) {
      setFilters(initialFilters);
      setActiveFilter(initialFilters[0].value);
    }
  }, []);

  const filterMapValues = filters.map((f) => f.value);

  const applyFilters = async () => {
    const filterFormValues = getPayload();
    const body = {
      view: activeTab,
      keyword: filterFormValues?.keyword ?? "",
      vehicles: filterFormValues?.vehicles?.value ?? "",
      active: filterFormValues?.active?.value ?? "",
    };
    await fetchAffiliates(body);
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("search") && (
        <div className="inline-flex items-center justify-start border-b">
          <input
            type="text"
            placeholder="Search..."
            value={values.keyword || ""}
            onChange={(e) => {
              updateValue("keyword", e.target.value);
            }}
            className="px-3 py-2 outline-none text-sm"
          />
          <Search className="w-4 text-muted-foreground me-3" />
        </div>
      )}

      {filterMapValues.includes("vehicles") && (
        <DropdownFilter
          label="No of Vehicles Affiliate"
          options={[
            { label: "1-10", value: "1-10" },
            { label: "11-50", value: "11-50" },
            { label: "51-100", value: "51-100" },
            { label: "100+", value: "100+" },
          ]}
          // multiSelect
          value={values.vehicles}
          onChange={(val) => updateValue("vehicles", val)}
        />
      )}

      {filterMapValues.includes("active") && (
        <DropdownFilter
          label="Active Status"
          options={[
            { label: "Active", value: "1" },
            { label: "Inactive", value: "0" },
            { label: "All", value: "" },
          ]}
          // multiSelect
          value={values.active}
          onChange={(val) => updateValue("active", val)}
        />
      )}

      <div className="flex items-center gap-2 ml-auto">
        {filterMapValues.length > 0 && (
          <>
            <Button size="lg" onClick={applyFilters}>
              Search
              <Search />
            </Button>
            <ClearFiltersByReload />
          </>
        )}
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-sm text-muted-foreground ml-2"
          onClick={() =>
            showDrawer({
              title: "Apply Filters",
              size: "xl",
              content: <DrawerContent availableFilters={availableFilters} />,
            })
          }
        >
          More Filters
          <Menu className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AffiliatesFiltersForm;

function DrawerContent({ availableFilters }) {
  const { filters, addFilter, removeFilter, getMaxFilters } = useFiltersStore();
  const maxFilters = getMaxFilters();
  const isLimitReached = filters.length >= maxFilters;

  return (
    <div className="py-4 space-y-6">
      {/* Current Views */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Current Filters</h3>
        <div className="flex flex-col flex-wrap gap-2">
          {filters.map((filter) => (
            <CheckboxInput
              key={filter.value}
              title={filter.label}
              checked={true}
              onChange={(e) => {
                if (!e.target.checked) {
                  removeFilter(filter.value);
                }
              }}
            />
          ))}
          {filters.length === 0 && (
            <span className="text-xs text-gray-400">No views selected</span>
          )}
        </div>
      </div>

      {/* Available Views */}
      <div className="space-y-4">
        {availableFilters.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-medium mb-2">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isSelected = filters.some(
                  (t) => t.value === option.value
                );
                return (
                  <CheckboxInput
                    key={option.value}
                    title={option.label}
                    checked={isSelected}
                    disabled={!isSelected && isLimitReached} // 👈 disable new add if limit reached
                    onChange={(e) => {
                      if (e.target.checked) {
                        addFilter(option);
                      } else {
                        removeFilter(option.value);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isLimitReached && (
        <p className="text-xs text-orange-500">
          Maximum {maxFilters} views allowed. Please remove one to add another.
        </p>
      )}
    </div>
  );
}
