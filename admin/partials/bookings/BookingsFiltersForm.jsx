"use client";
import { useEffect } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";

import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

import {
  BOOKINGS_AVAILABLE_FILTERS,
  BOOKINGS_INITIAL_FILTERS,
  BOOKING_STATUSES,
  LAST_ACTIVITY,
} from "@/constants/rentify_constants";

import { useDrawer } from "@/context/drawer-context";

import useBookingsStore, {
  useBookingsFiltersStore,
  useBookingsViewTabsStore,
} from "@/stores/rentify/useBookingsStore";
import useModelsStore from "@/stores/rentify/useModelsStore";
import useBodyTypesStore from "@/stores/rentify/useBodyTypesStore";

import DatePickerInput from "@/components/FormFields/DatePickerInput";
import NumberInput from "@/components/FormFields/NumberInput";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const BookingsFilterForm = ({ isDrawer = false }) => {
  const { hideDrawer, showDrawer } = useDrawer();
  const {
    filters,
    setFilters,
    setActiveFilter,
    updateValue,
    values,
    getPayload,
  } = useBookingsFiltersStore();

  const { models, fetchModels } = useModelsStore();
  const { bodyTypes, fetchBodyTypes } = useBodyTypesStore();

  const { activeTab } = useBookingsViewTabsStore();
  const { fetchBookings } = useBookingsStore();

  useEffect(() => {
    if (filters.length === 0) {
      setFilters(BOOKINGS_INITIAL_FILTERS);
      setActiveFilter(BOOKINGS_INITIAL_FILTERS[0].value);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchBodyTypes();
  }, [fetchModels, fetchBodyTypes]);

  const filterMapValues = filters.map((f) => f.value);



  /*
const initialValues = {
  booking_uid: "",
  booking_status_id: "",
  pickup_time: "",
  last_activity: "",
  client_name: "",
  client_phone: "",
  client_email: "",
  model_id: "",
  body_type_id: "",
  rent_price: "",
  view:"all_bookings"
};
*/

  const handleSearch = async () => {
    await fetchBookings();
  };

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
      }`}
    >
      {/* Booking ID */}
      {filterMapValues.includes("booking_uid") && (
        <span>
          <TextInput
            label="Booking ID"
            value={values.booking_uid || ""}
            onChange={(val) => updateValue("booking_uid", val.target.value)}
          />
        </span>
      )}

      {/* Booking Status */}
      {filterMapValues.includes("booking_status_id") && (
        <span>
          <DropdownFilter
            label="Booking Status"
            options={BOOKING_STATUSES}
            value={values.booking_status_id}
            onChange={(val) => updateValue("booking_status_id", val)}
          />
        </span>
      )}

      {/* Booking Date */}
      {filterMapValues.includes("pickup_time") && (
        <span>
          <DatePickerInput
            label="Booking Date"
            value={values.pickup_time}
            onChange={(val) => updateValue("pickup_time", val)}
          />
        </span>
      )}

      {/* Last Activity */}
      {filterMapValues.includes("last_activity") && (
        <span>
          <DropdownFilter
            label="Last Activity"
            options={LAST_ACTIVITY}
            value={values.last_activity}
            onChange={(val) => updateValue("last_activity", val)}
          />
        </span>
      )}

      {/* Client Name */}
      {filterMapValues.includes("client_name") && (
        <span>
          <TextInput
            label="Client Name"
            value={values.client_name}
            onChange={(val) => updateValue("client_name", val.target.value)}
          />
        </span>
      )}

      {/* Client Phone */}
      {filterMapValues.includes("client_phone") && (
        <span>
          <TextInput
            label="Client Phone"
            type="tel"
            value={values.client_phone}
            onChange={(val) => updateValue("client_phone", val.target.value)}
          />
        </span>
      )}

      {/* Client Email */}
      {filterMapValues.includes("client_email") && (
        <span>
          <TextInput
            label="Client Email"
            type="email"
            value={values.client_email}
            onChange={(val) => updateValue("client_email", val.target.value)}
          />
        </span>
      )}

      {/* Vehicle Model */}
      {filterMapValues.includes("model_id") && (
        <span>
          <DropdownFilter
            label="Vehicle Model"
            options={getDropdownFormattedData(models)}
            value={values.model_id || 0}
            onChange={(val) => updateValue("model_id", val)}
          />
        </span>
      )}

      {/* Vehicle Type */}
      {filterMapValues.includes("body_type_id") && (
        <span>
          <DropdownFilter
            label="Vehicle Type"
            options={getDropdownFormattedData(bodyTypes)}
            value={values.body_type_id}
            onChange={(val) => updateValue("body_type_id", val)}
          />
        </span>
      )}

      {/* Rental Fee */}
      {filterMapValues.includes("rent_price") && (
        <span>
          <NumberInput
            label="Rental Fee"
            value={values.rent_price}
            onChange={(val) => updateValue("rent_price", val?.target?.value)}
          />
        </span>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {filters.length > 0 && (
          <>
            <Button size="lg" onClick={handleSearch}>
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
              content: (
                <DrawerContent availableFilters={BOOKINGS_AVAILABLE_FILTERS} />
              ),
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

export default BookingsFilterForm;

function DrawerContent({ availableFilters }) {
  const { filters, addFilter, removeFilter, getMaxFilters } =
    useBookingsFiltersStore();
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
                    disabled={!isSelected && isLimitReached}
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
