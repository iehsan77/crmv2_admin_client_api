"use client";

import CheckboxInput from "@/components/FormFields/CheckboxInput";

function CurrentFilters({ filters, removeFilter }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Current Filters</h3>
      <div className="flex flex-col flex-wrap gap-2">
        {filters.map((filter) => (
          <CheckboxInput
            key={filter.value}
            title={filter.label}
            checked={true}
            onChange={(e) => {
              if (!e.target.checked) removeFilter(filter.value);
            }}
          />
        ))}
        {filters.length === 0 && (
          <span className="text-xs text-gray-400">No filters selected</span>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ group, filters, addFilter, removeFilter, isLimitReached }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{group.title}</h4>
      <div className="space-y-2">
        {group.options.map((option) => {
          const isSelected = filters.some((t) => t.value === option.value);
          return (
            <CheckboxInput
              key={option.value}
              title={option.label}
              checked={isSelected}
              disabled={!isSelected && isLimitReached}
              onChange={(e) => {
                if (e.target.checked) addFilter(option);
                else removeFilter(option.value);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function FiltersDrawerContent({ availableFilters, useFiltersStore }) {
  // 👉 now the store is passed as a prop
  const { filters, addFilter, removeFilter, getMaxFilters } = useFiltersStore();
  const maxFilters = getMaxFilters();
  const isLimitReached = filters.length >= maxFilters;

  return (
    <div className="py-4 space-y-6">
      {/* Current Filters */}
      <CurrentFilters filters={filters} removeFilter={removeFilter} />

      {/* Available Filters */}
      <div className="space-y-4">
        {availableFilters.map((group) => (
          <FilterGroup
            key={group.title}
            group={group}
            filters={filters}
            addFilter={addFilter}
            removeFilter={removeFilter}
            isLimitReached={isLimitReached}
          />
        ))}
      </div>

      {/* Limit Notice */}
      {isLimitReached && (
        <p className="text-xs text-orange-500">
          Maximum {maxFilters} filters allowed. Please remove one to add another.
        </p>
      )}
    </div>
  );
}
