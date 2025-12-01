"use client";

import { useEffect, useMemo } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";

import { useDrawer } from "@/context/drawer-context";

import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import useMeetingsStore, {
  useMeetingsFiltersStore,
} from "@/stores/crm/useMeetingsStore";

import FiltersDrawerContent from "@/partials/FiltersDrawerContent";

import {
  MEETINGS_AVAILABLE_FILTERS,
  MEETINGS_INITIAL_FILTERS,
  MEETINGS_STATUS_OPTIONS,
  MEETINGS_VENUES,
  RELATED_TO_OPTIONS,
} from "@/constants/crm_constants";
import ClearFilters from "@/components/ClearFilters";

const FiltersForm = ({ isDrawer = false, showMoreButton = true }) => {
  const { showDrawer } = useDrawer();
  const { filters, setFilters, setActiveFilter, values, updateValue } =
    useMeetingsFiltersStore();

  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();
  const { page, setPage, fetchRecords } = useMeetingsStore();

  // Fetch initial data
  useEffect(() => {
    fetchRecords();
    fetchSystemUsers();
  }, [page]);

  // Initialize filters
  useEffect(() => {
    if (filters.length === 0) {
      setFilters(MEETINGS_INITIAL_FILTERS);
      setActiveFilter(MEETINGS_INITIAL_FILTERS[0].value);
    }
  }, []);

  // Prepare system user options
  const userOptions = useMemo(
    () =>
      (systemUsers ?? []).map((u) => ({
        label:
          `${u?.first_name ?? ""} ${u?.last_name ?? ""} (${
            u?.email ?? ""
          })`.trim() || `User #${u?.id}`,
        value: u?.id,
      })),
    [systemUsers]
  );

  const filterMapValues = filters.map((f) => f.value);

  const handleSearch = () => {
    setPage(1);
    fetchRecords();
  };

  const handleMoreFilters = () => {
    showDrawer({
      title: "Apply Filters",
      size: "xl",
      content: (
        <FiltersDrawerContent
          availableFilters={MEETINGS_AVAILABLE_FILTERS}
          useFiltersStore={useMeetingsFiltersStore}
        />
      ),
    });
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 pt-6 bg-[#F5F9FF]"
      }`}
    >
      {/* VENUE */}
      {filterMapValues.includes("venue") && (
        <span>
          <DropdownFilter
            label="Meeting Venue"
            options={MEETINGS_VENUES}
            value={values.venue}
            onChange={(val) => updateValue("venue", val)}
          />
        </span>
      )}

      {/* LOCATION */}
      {filterMapValues.includes("location") && (
        <span>
          <TextInput
            label="Location"
            value={values.location || ""}
            onChange={(e) => updateValue("location", e.target.value)}
          />
        </span>
      )}

      {/* START TIME */}
      {filterMapValues.includes("start_time") && (
        <span>
          <DateTimePickerInput
            label="Start Time"
            value={values.start_time}
            onChange={(val) => updateValue("start_time", val)}
          />
        </span>
      )}

      {/* END TIME */}
      {filterMapValues.includes("end_time") && (
        <span>
          <DateTimePickerInput
            label="End Time"
            value={values.end_time}
            onChange={(val) => updateValue("end_time", val)}
          />
        </span>
      )}

      {/* OWNER */}
      {filterMapValues.includes("owner_id") && (
        <span>
          <DropdownFilter
            label="Owner"
            options={userOptions}
            value={values.owner_id}
            onChange={(val) => updateValue("owner_id", val)}
          />
        </span>
      )}

      {/* RELATED TO NAME */}     
      {/*filterMapValues.includes("related_to") && (
        <span>
          <DropdownFilter
            label="Related To"
            options={RELATED_TO_OPTIONS}
            value={values.related_to}
            onChange={(val) => updateValue("related_to", val)}
          />
        </span>
      )*/}

      {/* STATUS */}
      {filterMapValues.includes("status_id") && (
        <span>
          <DropdownFilter
            label="Status"
            options={MEETINGS_STATUS_OPTIONS}
            value={values.status_id}
            onChange={(val) => updateValue("status_id", val)}
          />
        </span>
      )}

      {/* ACTION BUTTONS */}
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
              useStore={useMeetingsStore}
              useFiltersStore={useMeetingsFiltersStore}
            />
          </>
        )}
        {showMoreButton && (
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-sm text-muted-foreground ml-2"
            onClick={handleMoreFilters}
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
