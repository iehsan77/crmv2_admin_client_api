"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import CheckboxInput from "@/components/FormFields/CheckboxInput";
import DatePickerInput from "@/components/FormFields/DatePickerInput";
import MultiSelectInput from "@/components/FormFields/MultiSelectInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";

import {
  RECORD_FOR_OPTIONS,
  RELATED_TO_OPTIONS,
  REMINDER_OPTIONS,
  TASKS_STATUS_OPTIONS,
  TASKS_PRIORITIES_OPTIONS,
} from "@/constants/crm_constants";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { tryParseJSON } from "@/helper/GeneralFunctions";

import useTasksStore from "@/stores/crm/useTasksStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";

import { useDrawer } from "@/context/drawer-context";

export default function RecordForm({ record = {} }) {
  console.log("record 36");
  console.log(record);

  const { hideDrawer } = useDrawer();
  const [showRelatedTo, setShowRelatedTo] = useState(false);
  const [owners, setOwners] = useState([]);

  const [taskForLabel, setTaskForLabel] = useState("");
  const [taskForOptionsData, setTaskForOptionsData] = useState([]);
  const [loadingTaskForOptionsData, setLoadingTaskForOptionsData] =
    useState(false);

  const [relatedToLabel, setRelatedToLabel] = useState("");
  const [relatedToOptionsData, setRelatedToOptionsData] = useState([]);
  const [loadingRelatedToOptionsData, setLoadingRelatedToOptionsData] =
    useState(false);

  const [allDay, setAllDay] = useState(false);

  const saveRecord = useTasksStore((state) => state.saveRecord);
  const updateRecord = useTasksStore((state) => state.updateRecord);

  const systemUsers = useSystemUsersStore((s) => s.systemUsers);
  const fetchSystemUsers = useSystemUsersStore((s) => s.fetchSystemUsers);

  // FORM
  const defaultValues = useMemo(() => FormValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });
  const {
    watch,
    reset,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = methods;
  const handleChange = (name, value) => {
    setValue(name, value);
  };

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

  const taskFor = watch("task_for");
  useEffect(() => {
    const fetchTaskForData = async () => {
      setTaskForOptionsData([]);
      if (!taskFor) return;

      setLoadingTaskForOptionsData(true);
      if (taskFor === "leads") {
        setTaskForLabel(" Lead");
        const response = await POST(crm_endpoints?.crm?.leads?.get);
        if (response?.status === 200 && response?.data?.length > 0) {
          setTaskForOptionsData(
            response.data.map((item) => {
              const name =
                item?.name?.trim() ||
                `${(item?.first_name ?? "").trim()} ${(
                  item?.last_name ?? ""
                ).trim()}`.trim() ||
                "Unnamed";

              // Pick the first available contact field
              const contact =
                item?.mobile?.trim() ||
                item?.phone?.trim() ||
                item?.fax?.trim() ||
                "";
              const label = name + " (" + contact + ")";
              return {
                label: String(label),
                value: String(item?.id),
              };
            })
          );
        }
        setLoadingTaskForOptionsData(false);
      } else if (taskFor === "contacts") {
        setTaskForLabel(" Contact");
        const response = await POST(crm_endpoints?.crm?.contacts?.get);

        if (response?.status === 200 && response.data.length > 0) {
          setTaskForOptionsData(
            response.data.map((item) => {
              const name =
                item?.name?.trim() ||
                `${(item?.first_name ?? "").trim()} ${(
                  item?.last_name ?? ""
                ).trim()}`.trim() ||
                "Unnamed";

              const contact =
                item?.mobile?.trim() ||
                item?.phone?.trim() ||
                item?.fax?.trim() ||
                "";
              const label = name + " (" + contact + ")";
              return {
                label: String(label),
                value: String(item?.id),
              };
            })
          );
        }

        setLoadingTaskForOptionsData(false);
      }
    };
    fetchTaskForData();
  }, [taskFor]);

  const relatedTo = watch("related_to");
  useEffect(() => {
    const fetchRelatedToData = async () => {
      setRelatedToOptionsData([]);
      if (!relatedTo) return;

      setLoadingRelatedToOptionsData(true);
      if (relatedTo === "accounts") {
        setRelatedToLabel(" Account");
        const response = await POST(crm_endpoints?.crm?.accounts?.get);
        if (response?.status === 200 && response?.data?.length > 0) {
          setRelatedToOptionsData(
            response.data.map((item) => {
              const contact =
                item?.mobile?.trim() ||
                item?.phone?.trim() ||
                item?.fax?.trim() ||
                "";
              const label = item?.title + " (" + contact + ") : " + item?.email;
              return {
                label: String(label),
                value: String(item?.id),
              };
            })
          );
        }
        setLoadingRelatedToOptionsData(false);
      } else if (relatedTo === "deals") {
        setRelatedToLabel(" Deal");
        const response = await POST(crm_endpoints?.crm?.deals?.get);
        if (
          response?.status === 200 &&
          Array.isArray(response?.data) &&
          response.data.length > 0
        ) {
          setRelatedToOptionsData(
            response.data.map((item) => {
              return {
                label: String(item?.title),
                value: String(item?.id),
              };
            })
          );
        }

        setLoadingRelatedToOptionsData(false);
      } else if (relatedTo === "campaigns") {
        setRelatedToLabel(" Campaign");

        const response = await POST(crm_endpoints?.crm?.campaigns?.get);
        if (response?.status === 200 && response?.data?.length > 0) {
          setRelatedToOptionsData(
            response.data.map((item) => {
              return {
                label: String(item?.title),
                value: String(item?.id),
              };
            })
          );
        }
        setLoadingRelatedToOptionsData(false);
      }
      //setRelatedToOptionsData([{ label: relatedTo + " 1", value: "1" }]);
    };
    fetchRelatedToData();
  }, [relatedTo]);

  useEffect(() => {
    if (taskFor === "contacts") {
      setShowRelatedTo(true);
    } else {
      setShowRelatedTo(false);
    }
  }, [taskFor]);

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        task_for_ids: JSON.stringify(formData?.task_for_ids) || "",
        participant_ids: JSON.stringify(formData?.participant_ids) || "",
        related_to_ids: JSON.stringify(formData?.related_to_ids) || "",
        deletable: 0,
      };
      
      //console.log("body 114"); console.log(body); //  return false;
     
      if (formData?.id) {
        await updateRecord(body, { onSuccess: () => hideDrawer() });
      } else {
        await saveRecord(body, { onSuccess: () => hideDrawer() });
      }
      //reset();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <h2 className="text-md font-semibold text-gray-800 mb-6">
            Tasks Information
          </h2>

          {/* Owner */}
          <SingleSelectInput
            label="Assigned To"
            options={userOptions}
            value={watch("assigned_to_id")}
            onChange={(option) => handleChange("assigned_to_id", option)}
            error={errors.assigned_to_id?.message}
            clearError={() => clearErrors("assigned_to_id")}
          />

          <TextInput
            label="Subject"
            type="text"
            value={watch("subject")}
            error={errors.subject?.message}
            {...register("subject")}
            maxLength={100}
          />

          <SingleSelectInput
            label="Task Owner"
            options={userOptions}
            value={watch("owner_id")}
            onChange={(option) => handleChange("owner_id", option)}
            error={errors.owner_id?.message}
            clearError={() => clearErrors("owner_id")}
          />

          <DatePickerInput
            label="Due Date"
            value={watch("due_date")}
            onChange={(option) => handleChange("due_date", option)}
            error={errors.due_date?.message}
            clearError={() => clearErrors("due_date")}
            minDate={new Date().toISOString()}
          />

          {/* Row 1: Task For */}
          <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
            <div className="col-span-6 sm:col-span-2">
              <SingleSelectInput
                label="Task For"
                options={RECORD_FOR_OPTIONS}
                value={watch("task_for")}
                onChange={(option) => handleChange("task_for", option)}
                error={errors.task_for?.message}
                clearError={() => clearErrors("task_for")}
              />
            </div>
            <div className="col-span-6 sm:col-span-4">
              <SingleSelectInput
                label={`Select ${taskForLabel}`}
                options={taskForOptionsData}
                value={watch("task_for_id")}
                onChange={(option) => handleChange("task_for_id", option)}
                error={errors.task_for_id?.message}
                clearError={() => clearErrors("task_for_id")}
                loading={loadingTaskForOptionsData}
              />
            </div>
          </div>

          {/* Conditional: Related To */}
          {showRelatedTo && (
            <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
              <div className="col-span-6 sm:col-span-2">
                <SingleSelectInput
                  label="Related To"
                  options={RELATED_TO_OPTIONS}
                  value={watch("related_to")}
                  onChange={(option) => handleChange("related_to", option)}
                  error={errors.related_to?.message}
                  clearError={() => clearErrors("related_to")}
                />
              </div>
              <div className="col-span-6 sm:col-span-4">
                <SingleSelectInput
                  label={`Select ${relatedToLabel}`}
                  options={relatedToOptionsData}
                  value={watch("related_to_id")}
                  onChange={(option) => handleChange("related_to_id", option)}
                  error={errors.related_to_id?.message}
                  clearError={() => clearErrors("related_to_id")}
                  loading={loadingRelatedToOptionsData}
                />
              </div>
            </div>
          )}

          <SingleSelectInput
            label="Task Status"
            options={TASKS_STATUS_OPTIONS}
            value={watch("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />

          <SingleSelectInput
            label="Priority"
            options={TASKS_PRIORITIES_OPTIONS}
            value={watch("priority_id")}
            onChange={(option) => handleChange("priority_id", option)}
            error={errors.priority_id?.message}
            clearError={() => clearErrors("priority_id")}
          />

          <SingleSelectInput
            label="Participants Reminder"
            options={REMINDER_OPTIONS}
            value={watch("reminder")}
            onChange={(option) => handleChange("reminder", option)}
            error={errors.reminder?.message}
            clearError={() => clearErrors("reminder")}
          />

          <TextInput
            label="Description"
            type="text"
            error={errors.description?.message}
            {...register("description")}
            value={watch("description")}
            maxLength={500}
          />

          {/* Footer */}
          <div className="pt-8 flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => hideDrawer()}
            >
              Cancel
            </Button>
            <Button type="submit" isSubmitting={isSubmitting}>
              Submit
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}

// Default form values
// Default form values
export const FormValues = (record) => ({
  id: record?.id ?? 0,

  assigned_to_id: record?.assigned_to_id?.toString() ?? "",

  subject: record?.subject ?? "",
  owner_id: record?.owner_id?.toString() ?? "",

  due_date: record?.due_date ?? "",

  task_for: record?.task_for?.toString() ?? "",
  task_for_id: record?.task_for_id?.toString() ?? "",

  related_to: record?.related_to?.toString() ?? "",
  related_to_id: record?.related_to_id?.toString() ?? "",

  status_id: record?.status_id?.toString() ?? "",
  priority_id: record?.priority_id?.toString() ?? "",

  reminder: record?.reminder?.toString() ?? "",

  description: record?.description ?? "",
});

const requiredString = (field) =>
  z.string().min(1, { message: `${field} is required` });

// Form validation schema
export const FormSchema = z
  .object({
    id: z.number().default(0),

    subject: requiredString("Subject"),
    owner_id: requiredString("Task owner"),
    due_date: requiredString("Due date"),

    task_for: requiredString("Task for"),
    task_for_id: requiredString("Select Task For"),

    related_to: z.string().optional().nullable(),
    related_to_id: z.string().optional().nullable(),

    status_id: requiredString("Status"),
    priority_id: requiredString("Priority"),

    assigned_to_id: z.string().optional().or(z.literal("")),

    reminder: requiredString("Participants reminder"),

    description: z.string().optional(),
  })
  // 🔹 1. Related To validation
  .refine(
    (data) => {
      if (data.task_for === "contacts") {
        return !!data.related_to && !!data.related_to_id;
      }
      return true;
    },
    {
      message:
        "Related To and Select Related To are required when Task For is 'contacts'",
      path: ["related_to_id"],
    }
  )
  // 🔹 2. Due date must be today or in the future
  .refine(
    (data) => {
      if (!data.due_date) return false;

      const due = new Date(data.due_date);
      const today = new Date();

      // Remove time part to compare only dates
      due.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return due >= today;
    },
    {
      message: "Due date cannot be in the past",
      path: ["due_date"],
    }
  );

/*
export const FormSchema = z
  .object({
    id: z.number().default(0),

    subject: requiredString("Subject"),
    owner_id: requiredString("Task owner"),
    due_date: requiredString("Due date"),

    task_for: requiredString("Task for"),
    task_for_id: requiredString("Select Task For"),

    related_to: z.string().optional().nullable(),
    related_to_id: z.string().optional().nullable(),

    status_id: requiredString("Status"),
    priority_id: requiredString("Priority"),

    reminder: requiredString("Participants reminder"),

    description: z.string().optional(),
  })
  .refine(
    (data) => {
      // When "Task For" is "contacts", both related_to & related_to_id are required
      if (data.task_for === "contacts") {
        return !!data.related_to && !!data.related_to_id;
      }
      return true;
    },
    {
      message:
        "Related To and Select Related To are required when Task For is 'contacts'",
      path: ["related_to_id"],
    }
  );
*/
