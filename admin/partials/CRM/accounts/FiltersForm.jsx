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

import useUserStore from "@/stores/useUserStore";

import toast from "react-hot-toast";

import FiltersDrawerContent from "@/partials/FiltersDrawerContent";

import {
  ACCOUNTS_AVAILABLE_FILTERS,
  ACCOUNTS_INITIAL_FILTERS,
  ACCOUNTS_STATUS_OPTIONS,
  COMPANY_TYPES,
  LAST_ACTIVITY,
} from "@/constants/crm_constants";

import useAccountsStore, {
  useAccountsFiltersStore,
} from "@/stores/crm/useAccountsStore";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { INDUSTRIES } from "@/constants/general_constants";

import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import ClearFilters from "@/components/ClearFilters";

const FiltersForm = ({ isDrawer = false }) => {
  const { showDrawer } = useDrawer();
  const { filters, setFilters, setActiveFilter, values, updateValue } =
    useAccountsFiltersStore();
  const filterMapValues = filters.map((f) => f.value);
  useEffect(() => {
    if (filters.length === 0) {
      setFilters(ACCOUNTS_INITIAL_FILTERS);
      setActiveFilter(ACCOUNTS_INITIAL_FILTERS[0].value);
    }
  }, []);

  // 👥 System Users (fetched once globally via store)
  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();

  const page = useAccountsStore((s) => s.page);
  const setPage = useAccountsStore((s) => s.setPage);
  const fetchRecords = useAccountsStore((s) => s.fetchRecords);
  useEffect(() => {
    fetchRecords();
  }, [page]);

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
            label="Account Name"
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

      {filterMapValues.includes("industry_id") && (
        <span>
          <DropdownFilter
            label="Industry"
            options={INDUSTRIES}
            value={values.industry_id}
            onChange={(val) => updateValue("industry_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("type_id") && (
        <span>
          <DropdownFilter
            label="Account Type"
            options={COMPANY_TYPES}
            value={values.type_id}
            onChange={(val) => updateValue("type_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("annual_revenue") && (
        <span>
          <NumberInput
            label="Annual Revenue"
            value={values.annual_revenue || ""}
            onChange={(val) => updateValue("annual_revenue", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("employees") && (
        <span>
          <NumberInput
            label="Employees"
            value={values.employees || ""}
            onChange={(val) => updateValue("employees", val.target.value)}
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

      {/* 
      {filterMapValues.includes("assigned_team") && <span></span>}
      */}

      {filterMapValues.includes("status_id") && (
        <span>
          <span>
            <DropdownFilter
              label="Account Status"
              options={ACCOUNTS_STATUS_OPTIONS}
              value={values.status_id}
              onChange={(val) => updateValue("status_id", val)}
            />
          </span>
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

      {filterMapValues.includes("create_date") && (
        <span>
          <DatePickerInput
            label="Create Date"
            value={values.create_date}
            onChange={(val) => updateValue("create_date", val)}
          />
        </span>
      )}
      {/*       
      {filterMapValues.includes("contact_source") && <span></span>}      
      {filterMapValues.includes("account_rating") && <span></span>}
      {filterMapValues.includes("country") && <span></span>}
      {filterMapValues.includes("state_region") && <span></span>}
      {filterMapValues.includes("related_contacts") && <span></span>}
      {filterMapValues.includes("related_deals") && <span></span>} 
      */}

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
              useStore={useAccountsStore}
              useFiltersStore={useAccountsFiltersStore}
            />
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
                <FiltersDrawerContent
                  availableFilters={ACCOUNTS_AVAILABLE_FILTERS}
                  useFiltersStore={useAccountsFiltersStore}
                />
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
export default FiltersForm;
