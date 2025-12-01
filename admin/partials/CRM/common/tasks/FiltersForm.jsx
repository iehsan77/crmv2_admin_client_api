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
  TASKS_STATUS_OPTIONS,
  TASKS_PRIORITIES_OPTIONS,
  TASKS_AVAILABLE_FILTERS,
  TASKS_INITIAL_FILTERS,
  LAST_ACTIVITY,
  RELATED_TO_OPTIONS,
  REMINDER_OPTIONS,
} from "@/constants/crm_constants";

import useTasksStore, {
  useTasksFiltersStore,
} from "@/stores/crm/useTasksStore";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";
import ClearFilters from "@/components/ClearFilters";

const FiltersForm = ({ isDrawer = false }) => {
  const { hideDrawer, showDrawer } = useDrawer();
  const { filters, setFilters, setActiveFilter, values, updateValue } =
    useTasksFiltersStore();

  const filterMapValues = filters.map((f) => f.value);

  const [users, setUsers] = useState([]);

  const page = useTasksStore((s) => s.page);
  const setPage = useTasksStore((s) => s.setPage);
  const fetchRecords = useTasksStore((s) => s.fetchRecords);

  // 👥 System Users (fetched once globally via store)
  const { systemUsers, fetchSystemUsers } = useSystemUsersStore();

  useEffect(() => {
    fetchRecords();
  }, [page]);

  useEffect(() => {
    if (filters.length === 0) {
      setFilters(TASKS_INITIAL_FILTERS);
      setActiveFilter(TASKS_INITIAL_FILTERS[0].value);
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

  return (
    <div
      className={`${
        isDrawer
          ? "w-full grid gap-4"
          : "flex flex-wrap items-center gap-4 p-2 pt-6 bg-[#F5F9FF]"
      }`}
    >
      {filterMapValues.includes("subject") && (
        <span>
          <TextInput
            label="Subject"
            value={values.subject || ""}
            onChange={(val) => updateValue("subject", val.target.value)}
          />
        </span>
      )}

      {filterMapValues.includes("related_to") && (
        <span>
          <DropdownFilter
            label="Related To"
            options={RELATED_TO_OPTIONS}
            value={values.related_to}
            onChange={(val) => updateValue("related_to", val)}
          />
        </span>
      )}

      {filterMapValues.includes("status_id") && (
        <span>
          <DropdownFilter
            label="Status"
            options={TASKS_STATUS_OPTIONS}
            value={values.status_id}
            onChange={(val) => updateValue("status_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("priority_id") && (
        <span>
          <DropdownFilter
            label="Priority"
            options={TASKS_PRIORITIES_OPTIONS}
            value={values.priority_id}
            onChange={(val) => updateValue("priority_id", val)}
          />
        </span>
      )}

      {filterMapValues.includes("due_date") && (
        <span>
          <DatePickerInput
            label="Due Date"
            value={values.due_date}
            onChange={(val) => updateValue("due_date", val)}
          />
        </span>
      )}

      {filterMapValues.includes("reminder") && (
                <span>
          <DropdownFilter
            label="Reminder"
            options={REMINDER_OPTIONS}
            value={values.reminder}
            onChange={(val) => updateValue("reminder", val)}
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

      {filterMapValues.includes("last_modified_by") && (
        <span>
          <DropdownFilter
            label="Last Modified By"
            options={userOptions}
            value={values.last_modified_by}
            onChange={(val) => updateValue("last_modified_by", val)}
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

      {filterMapValues.includes("completion_date") && (
        <span>
          <DatePickerInput
            label="Completion Date"
            value={values.completion_date}
            onChange={(val) => updateValue("completion_date", val)}
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
              useStore={useTasksStore}
              useFiltersStore={useTasksFiltersStore}
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
                  availableFilters={TASKS_AVAILABLE_FILTERS}
                  useFiltersStore={useTasksFiltersStore}
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
