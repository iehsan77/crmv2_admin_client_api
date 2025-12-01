"use client";
import { useState, useEffect, useMemo } from "react";
import { Menu, Search } from "lucide-react";

import Button from "@/components/Button";
import DropdownFilter from "@/components/DropdownFilter";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import NumberInput from "@/components/FormFields/NumberInput";

import { useDrawer } from "@/context/drawer-context";

import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";

import toast from "react-hot-toast";

import FiltersDrawerContent from "@/partials/FiltersDrawerContent";

import {
  LEADS_AVAILABLE_FILTERS,
  LEADS_INITIAL_FILTERS,
  COMPANY_TYPES,
  LAST_ACTIVITY,
  LEADS_STATUS_OPTIONS,
  LEADS_SOURCES_OPTIONS,
} from "@/constants/crm_constants";

import useLeadsStore, {
  useLeadsFiltersStore,
} from "@/stores/crm/useLeadsStore";

import useAccountsStore from "@/stores/crm/useAccountsStore";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import {
  COUNTRIES,
  STATES,
  USER_ROLES,
} from "@/constants/general_constants";
import ClearFilters from "@/components/ClearFilters";
import { getDropdownFormattedData } from "@/helper/GeneralFunctions";

const FiltersForm = ({ isDrawer = false, showMoreButton = true }) => {
  const { hideDrawer, showDrawer } = useDrawer();
  const {
    filters,
    setFilters,
    setActiveFilter,
    values,
    updateValue,
    getPayload,
  } = useLeadsFiltersStore();

  const filterMapValues = filters.map((f) => f.value);

  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();
  const {
    records: accounts,
    fetchRecords: fetchAccounts,
    //setFetchAll: setFetchAllAccounts,
  } = useAccountsStore();

  const page = useLeadsStore((s) => s.page);
  const setPage = useLeadsStore((s) => s.setPage);
  const fetchRecords = useLeadsStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchRecords();
  }, [page]);

  useEffect(() => {
    // Initialize filters only once when empty
    if (!filters || filters.length === 0) {
      setFilters(LEADS_INITIAL_FILTERS);
      setActiveFilter(LEADS_INITIAL_FILTERS[0]?.value || "");
    }

    // Fetch all accounts once on mount
    //setFetchAllAccounts(true);
    fetchAccounts();
  }, []); // ✅ empty deps to prevent infinite re-renders

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

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 pt-6 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("title") && (
        <span>
          <TextInput
            label="Name"
            value={values.title || ""}
            onChange={(val) => updateValue("title", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("email") && (
        <span>
          <TextInput
            label="Email"
            value={values.email || ""}
            onChange={(val) => updateValue("email", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("phone") && (
        <span>
          <TextInput
            label="phone"
            value={values.phone || ""}
            onChange={(val) => updateValue("phone", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("mobile") && (
        <span>
          <TextInput
            label="Mobile"
            value={values.mobile || ""}
            onChange={(val) => updateValue("mobile", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("fax") && (
        <span>
          <TextInput
            label="Fax"
            value={values.fax || ""}
            onChange={(val) => updateValue("fax", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("website") && (
        <span>
          <TextInput
            label="Website"
            value={values.website || ""}
            onChange={(val) => updateValue("website", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("created_on") && (
        <span>
          <DatePickerInput
            label="Create Date"
            value={values.created_on}
            onChange={(val) => updateValue("created_on", val)}
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

      {filterMapValues.includes("account_id") && (
        <span>
          <DropdownFilter
            label="Account Name"
            options={getDropdownFormattedData(accounts)}
            value={values.account_id}
            onChange={(val) => updateValue("account_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("status_id") && (
        <span>
          <DropdownFilter
            label="Status"
            options={LEADS_STATUS_OPTIONS}
            value={values.status_id}
            onChange={(val) => updateValue("status_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("source_id") && (
        <span>
          <DropdownFilter
            label="Lead Source"
            options={LEADS_SOURCES_OPTIONS}
            value={values.source_id}
            onChange={(val) => updateValue("source_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("role_id") && (
        <span>
          <DropdownFilter
            label="Lead Role"
            options={USER_ROLES}
            value={values.role_id}
            onChange={(val) => updateValue("role_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("country_id") && (
        <span>
          <DropdownFilter
            label="Country"
            options={COUNTRIES}
            value={values.country_id}
            onChange={(val) => updateValue("country_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("state_id") && (
        <span>
          <DropdownFilter
            label="State"
            options={STATES}
            value={values.state_id}
            onChange={(val) => updateValue("state_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("postal_code") && (
        <span>
          <TextInput
            label="Postal Code"
            value={values.postal_code || ""}
            onChange={(val) => updateValue("postal_code", val)}
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
              Search
              <Search />
            </Button>
            <ClearFilters
              useStore={useLeadsStore}
              useFiltersStore={useLeadsFiltersStore}
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
                    availableFilters={LEADS_AVAILABLE_FILTERS}
                    useFiltersStore={useLeadsFiltersStore}
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
