"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { Menu, Search } from "lucide-react";

import { useDrawer } from "@/context/drawer-context";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import NumberInput from "@/components/FormFields/NumberInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";

import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/rentify_constants";

import { POST, GET } from "@/helper/ServerSideActions";
import { rentify_endpoints } from "@/utils/rentify_endpoints";

import useAffiliateStore, {
  useFiltersStore,
  useViewTabsStore,
} from "@/stores/rentify/affiliates/useAffiliateStore";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";
import DateRangePicker from "@/components/FormFields/DateRangePicker";
import ClearFiltersByReload from "@/components/ClearFiltersByReload";

const FilterForm = ({ isDrawer = false }) => {
  const { id } = useParams();
  const { hideDrawer, showDrawer } = useDrawer();
  const [clients, setClients] = useState([]);
  const {
    filters,
    setFilters,
    setActiveFilter,
    updateValue,
    values,
    getPayload,
  } = useFiltersStore();
  const { activeTab } = useViewTabsStore();

  const {
    fetchBookingHistory,
    bookingHistoryPayload,
    fetchBookingHistoryPayload,
  } = useAffiliateStore();

  // --- Available Filters ---
  const availableFilters = [
    {
      title: "Booking Info",
      options: [
        { label: "Booking ID", value: "booking_id" },
        { label: "Booking Date", value: "pickup_time" },
        { label: "Client", value: "client_id" },
        { label: "Vehicle", value: "vehicle_id" },
        { label: "Rental Period", value: "rental_period" },
        { label: "Rent Price", value: "rent_price" },
        { label: "Payment Status", value: "payment_status_id" },
        { label: "Security Deposit", value: "security_deposit" },
        { label: "Booking Status", value: "booking_status_id" },
      ],
    },
  ];

  // --- Initial Filters ---
  const initialFilters = [
    { label: "Booking ID", value: "booking_id" },
    { label: "Client", value: "client_id" },
    { label: "Vehicle", value: "vehicle_id" },
    { label: "Booking Date", value: "pickup_time" },
    { label: "Booking Status", value: "booking_status_id" },
  ];

  useEffect(() => {
    if (filters.length === 0) {
      setFilters(initialFilters);
      setActiveFilter(initialFilters[0].value);
    }
  }, []);

  const filterMapValues = filters.map((f) => f.value);

  const applyFilters = async () => {
    const filterFormValues = getPayload();

    console.log("filterFormValues 90");
    console.log(filterFormValues);

    const getValue = (field) => (field ? field.value : "");

    const rentalPeriod = filterFormValues?.rental_period;
    const rentalFrom = rentalPeriod?.from
      ? new Date(rentalPeriod.from).toISOString().split("T")[0]
      : "";
    const rentalTo = rentalPeriod?.to
      ? new Date(rentalPeriod.to).toISOString().split("T")[0]
      : "";

    const body = {
      affiliate_id: id,
      view: "all_bookings",
      booking_uid: filterFormValues?.booking_id ?? "",
      pickup_time: filterFormValues?.pickup_time ?? "",
      booking_status_id: getValue(filterFormValues?.booking_status_id) ?? "",
      customer_id: getValue(filterFormValues?.client_id) ?? "",
      payment_status_id: getValue(filterFormValues?.payment_status_id) ?? "",
      rent_price: filterFormValues?.rent_price ?? "",
      //rental_period: filterFormValues?.rental_period ?? "",

      rental_period_from: rentalFrom,
      rental_period_to: rentalTo,

      security_deposit: filterFormValues?.security_deposit ?? "",
      vehicle_id: getValue(filterFormValues?.vehicle_id) ?? "",
    };

    await fetchBookingHistory(body);
  };

  useEffect(() => {
    fetchBookingHistoryPayload(id);
  }, [fetchBookingHistoryPayload]);

  useEffect(() => {
    if (!bookingHistoryPayload?.clients) return;

    setClients(
      bookingHistoryPayload.clients.map((client) => {
        const fullName =
          client.name?.trim() ||
          `${client.first_name} ${client.last_name}`.trim() ||
          "";

        const label = fullName ? `${fullName} (${client.email})` : client.email;

        return {
          label,
          value: String(client.id),
        };
      })
    );
  }, [bookingHistoryPayload?.clients]);

  console.log("bookingHistoryPayload 1-07");
  console.log(bookingHistoryPayload);

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("booking_id") && (
        <span>
          <TextInput
            label=""
            placeholder="Booking ID"
            value={values.booking_id ?? ""}
            onChange={(val) => updateValue("booking_id", val?.target?.value)}
          />
        </span>
      )}
      {filterMapValues.includes("pickup_time") && (
        <span>
          <DatePickerInput
            label="Booking Date"
            value={values.pickup_time}
            onChange={(val) => updateValue("pickup_time", val)}
          />
        </span>
      )}
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
      {filterMapValues.includes("client_id") && (
        <span>
          <DropdownFilter
            label="Client"
            options={clients}
            value={values.client_id}
            onChange={(val) => updateValue("client_id", val)}
          />
        </span>
      )}
      {filterMapValues.includes("payment_status_id") && (
        <span>
          <DropdownFilter
            label="Payment Status"
            options={PAYMENT_STATUSES}
            value={values.payment_status_id}
            onChange={(val) => updateValue("payment_status_id", val)}
          />
        </span>
      )}
      {filterMapValues.includes("rent_price") && (
        <span>
          <NumberInput
            label="Rent Price"
            value={values.rent_price}
            onChange={(val) => updateValue("rent_price", val?.target.value)}
          />
        </span>
      )}
      {filterMapValues.includes("rental_period") && (
        <span>
          <DateRangePicker
            label="Rental Period"
            value={values.rental_period}
            onChange={(val) => updateValue("rental_period", val)}
          />
        </span>
      )}
      {filterMapValues.includes("security_deposit") && (
        <span>
          <NumberInput
            label="Security Deposit"
            placeholder=""
            value={values.security_deposit}
            onChange={(val) =>
              updateValue("security_deposit", val?.target?.value)
            }
          />
        </span>
      )}
      {filterMapValues.includes("vehicle_id") && (
        <span>
          <DropdownFilter
            label="Vehicle"
            options={getDropdownFormattedData(bookingHistoryPayload?.vehicles)}
            value={values.vehicle_id}
            onChange={(val) => updateValue("vehicle_id", val)}
          />
        </span>
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
          className="flex items-center text-sm text-muted-foreground ml-2"
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

export default FilterForm;

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
