"use client";
import { useEffect, useMemo } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";
import NumberInput from "@/components/FormFields/NumberInput";
import ClearFilters from "@/components/ClearFilters";

import { useDrawer } from "@/context/drawer-context";
import FiltersDrawerContent from "@/partials/FiltersDrawerContent";

import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import useCallsStore, {
  useCallsFiltersStore,
} from "@/stores/crm/useCallsStore";

import {
  CALLS_AVAILABLE_FILTERS,
  CALLS_INITIAL_FILTERS,
  RELATED_TO_OPTIONS,
} from "@/constants/crm_constants";

const FiltersForm = ({ isDrawer = false, showMoreButton = true }) => {
  const { showDrawer } = useDrawer();

  // 🧩 Calls Store
  const { filters, setFilters, setActiveFilter, values, updateValue } =
    useCallsFiltersStore();
  const { page, setPage, fetchRecords } = useCallsStore();

  // 👥 System Users (fetched once globally via store)
  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();

  // Fetch records on page change
  useEffect(() => {
    fetchRecords();
  }, [page]);

  // Initialize filters if empty
  useEffect(() => {
    if (filters.length === 0) {
      setFilters(CALLS_INITIAL_FILTERS);
      setActiveFilter(CALLS_INITIAL_FILTERS[0].value);
    }
  }, []);

  // FETCH SYSTEM USERS - starting
  useEffect(() => {
    if (!systemUsers?.length) fetchSystemUsers();
  }, [systemUsers?.length, fetchSystemUsers]);
  const userOptions = useMemo(() => {
    return (systemUsers ?? []).map((u) => ({
      label: String(
        `${u?.first_name ?? ""} ${u?.last_name ?? ""} (${
          u?.email ?? ""
        })`.trim() || `User #${u?.id}`
      ),
      value: String(u?.id),
    }));
  }, [systemUsers]);
  // FETCH SYSTEM USERS - ending

  const filterMapValues = useMemo(() => filters.map((f) => f.value), [filters]);

  // 🧱 Filter components
  const FILTER_FIELDS = {
    subject: (
      <TextInput
        label="Subject"
        value={values.subject || ""}
        onChange={(val) => updateValue("subject", val.target.value)}
      />
    ),
    start_time: (
      <DateTimePickerInput
        label="Call Start Time"
        value={values.start_time}
        onChange={(val) => updateValue("start_time", val)}
      />
    ),
    duration: (
      <NumberInput
        label="Call Duration"
        value={values.duration || ""}
        onChange={(val) => updateValue("duration", val.target.value)}
      />
    ),
    related_to: (
      <DropdownFilter
        label="Related To"
        options={RELATED_TO_OPTIONS}
        value={values.related_to}
        onChange={(val) => updateValue("related_to", val)}
      />
    ),
    owner_id: (
      <DropdownFilter
        label="Owner"
        options={userOptions}
        value={values.owner_id}
        onChange={(val) => updateValue("owner_id", val)}
      />
    ),
    assigned_to_id: (
      <DropdownFilter
        label="Assigned To Team"
        options={userOptions}
        value={values.assigned_to_id}
        onChange={(val) => updateValue("assigned_to_id", val)}
      />
    ),
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 pt-6 bg-[#F5F9FF]"
      }`}
    >
      {/* Render active filters */}
      {filterMapValues.map(
        (key) =>
          FILTER_FIELDS[key] && <span key={key}>{FILTER_FIELDS[key]}</span>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {filters.length > 0 && (
          <>
            <Button
              size="lg"
              onClick={() => {
                setPage(1);
                fetchRecords();
              }}
            >
              Search
              <Search />
            </Button>
            <ClearFilters
              useStore={useCallsStore}
              useFiltersStore={useCallsFiltersStore}
            />
          </>
        )}

        {showMoreButton && (
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-sm text-muted-foreground ml-2"
            onClick={() =>
              showDrawer({
                title: "Apply Filters",
                size: "xl",
                content: (
                  <FiltersDrawerContent
                    availableFilters={CALLS_AVAILABLE_FILTERS}
                    useFiltersStore={useCallsFiltersStore}
                  />
                ),
              })
            }
          >
            More Filters
            <Menu className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FiltersForm;
