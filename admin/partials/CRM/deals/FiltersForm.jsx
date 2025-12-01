"use client";
import { useEffect, useMemo } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import NumberInput from "@/components/FormFields/NumberInput";
import ClearFilters from "@/components/ClearFilters";

import { useDrawer } from "@/context/drawer-context";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import FiltersDrawerContent from "@/partials/FiltersDrawerContent";

import {
  DEALS_AVAILABLE_FILTERS,
  DEALS_INITIAL_FILTERS,
  DEALS_STAGES_OPTIONS,
  LEADS_SOURCES_OPTIONS,
  LAST_ACTIVITY,
  DEALS_SOURCE_OPTIONS,
} from "@/constants/crm_constants";

import useDealsStore, {
  useDealsFiltersStore,
} from "@/stores/crm/useDealsStore";

import useContactsStore from "@/stores/crm/useContactsStore";

export default function FiltersForm({
  isDrawer = false,
  showMoreButton = true,
}) {
  const { showDrawer } = useDrawer();
  const { filters, setFilters, setActiveFilter, values, updateValue } =
    useDealsFiltersStore();

    const { page, setPage, fetchRecords } = useDealsStore();
  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();
  const { records: contacts, fetchRecords: fetchContacts } = useContactsStore();

  // Initial fetch
  useEffect(() => {
    fetchRecords();
  }, [page]);
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Initialize filters if empty
  useEffect(() => {
    if (filters.length === 0) {
      setFilters(DEALS_INITIAL_FILTERS);
      setActiveFilter(DEALS_INITIAL_FILTERS[0].value);
    }
  }, [filters.length]);

  // Fetch system users
  useEffect(() => {
    if (!systemUsers?.length) fetchSystemUsers();
  }, [systemUsers?.length, fetchSystemUsers]);

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

  const contactsOptions = useMemo(
    () =>
      (contacts ?? []).map((c) => ({
        label:
          `${c?.first_name ?? ""} ${c?.last_name ?? ""} (${
            (c?.email || c?.mobile || c?.phone || c?.fax) ?? ""
          })`.trim() || `User #${c?.id}`,
        value: c?.id,
      })),
    [contacts]
  );

  const filterMapValues = filters.map((f) => f.value);

  const handleInput = (key) => (e) => updateValue(key, e.target.value);

  return (
    <div
      className={
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 pt-6 bg-[#F5F9FF]"
      }
    >
      {filterMapValues.includes("title") && (
        <span>
          <TextInput
            label="Deal Title/Name"
            value={values.title || ""}
            onChange={handleInput("title")}
          />
        </span>
      )}

      {filterMapValues.includes("email") && (
        <span>
          <TextInput
            label="Email"
            value={values.email || ""}
            onChange={handleInput("email")}
          />
        </span>
      )}

      {filterMapValues.includes("phone") && (
        <span>
          <TextInput
            label="Phone"
            value={values.phone || ""}
            onChange={handleInput("phone")}
          />
        </span>
      )}

      {filterMapValues.includes("amount") && (
        <span>
          <NumberInput
            label="Amount"
            value={values.amount || ""}
            onChange={handleInput("amount")}
          />
        </span>
      )}

      {filterMapValues.includes("probability") && (
        <span>
          <NumberInput
            label="Probability (%)"
            value={values.probability || ""}
            onChange={handleInput("probability")}
          />
        </span>
      )}

      {filterMapValues.includes("expected_revenue") && (
        <span>
          <NumberInput
            label="Expected Revenue"
            value={values.expected_revenue || ""}
            onChange={handleInput("expected_revenue")}
          />
        </span>
      )}

      {filterMapValues.includes("created_date") && (
        <span>
          <DatePickerInput
            label="Create Date"
            value={values.created_date}
            onChange={(val) => updateValue("created_date", val)}
          />
        </span>
      )}

      {filterMapValues.includes("closing_date") && (
        <span>
          <DatePickerInput
            label="Closing Date"
            value={values.closing_date}
            onChange={(val) => updateValue("closing_date", val)}
          />
        </span>
      )}

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

      {filterMapValues.includes("status_id") && (
        <span>
          <DropdownFilter
            label="Deal Stage"
            options={DEALS_STAGES_OPTIONS}
            value={values.status_id}
            onChange={(val) => updateValue("status_id", val)}
          />
        </span>
      )}

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

      {filterMapValues.includes("contact_id") && (
        <span>
          <DropdownFilter
            label="Contact Name"
            options={contactsOptions} // Replace later with dynamic options
            value={values.contact_id}
            onChange={(val) => updateValue("contact_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("source_id") && (
        <span>
          <DropdownFilter
            label="Deal Source"
            options={DEALS_SOURCE_OPTIONS}
            value={values.source_id}
            onChange={(val) => updateValue("source_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("campaign_source_id") && (
        <span>
          <DropdownFilter
            label="Campaign Source"
            options={[{ label: "Campaign 1", value: "1" }]} // Replace later with dynamic options
            value={values.campaign_source_id}
            onChange={(val) => updateValue("campaign_source_id", val)}
          />
        </span>
      )}

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
              Search <Search />
            </Button>
            <ClearFilters
              useStore={useDealsStore}
              useFiltersStore={useDealsFiltersStore}
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
                    availableFilters={DEALS_AVAILABLE_FILTERS}
                    useFiltersStore={useDealsFiltersStore}
                  />
                ),
              })
            }
          >
            More Filters <Menu className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
