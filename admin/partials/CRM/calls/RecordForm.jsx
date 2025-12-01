"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import Button from "@/components/Button";
import TextInput from "@/components/FormFields/TextInput";
import SingleSelectInput from "@/components/FormFields/SingleSelectInput";
import DateTimePickerInput from "@/components/FormFields/DateTimePickerInput";

import useCallsStore from "@/stores/crm/useCallsStore";
import useSystemUsersStore from "@/stores/settings/useSystemUsersStore";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { useDrawer } from "@/context/drawer-context";

import {
  CALLS_OUTGOING_STATUS_OPTIONS,
  CALLS_PURPOSE_OPTIONS,
  CALLS_STATUS_OPTIONS,
  CALLS_TYPES_OPTIONS,
  RECORD_FOR_OPTIONS,
  RELATED_TO_OPTIONS,
  REMINDER_OPTIONS,
} from "@/constants/crm_constants";

export default function RecordForm({ record = {} }) {
  const { id: ukey } = useParams();
  const router = useRouter();
  const { hideDrawer } = useDrawer();
  const [mode, setMode] = useState("schedule");

  const [callForLabel, setCallForLabel] = useState("");
  const [callForOptionsData, setCallForOptionsData] = useState([]);
  const [loadingCallForOptionsData, setLoadingCallForOptionsData] =
    useState(false);

  const [relatedToLabel, setRelatedToLabel] = useState("");
  const [relatedToOptionsData, setRelatedToOptionsData] = useState([]);
  const [loadingRelatedToOptionsData, setLoadingRelatedToOptionsData] =
    useState(false);

  const [owners, setOwners] = useState([]);
  const [showRelatedTo, setShowRelatedTo] = useState(false);

  const { saveRecord, updateRecord, selectedRecord, clearSelectedRecord } =
    useCallsStore();

  const systemUsers = useSystemUsersStore((s) => s.systemUsers);
  const fetchSystemUsers = useSystemUsersStore((s) => s.fetchSystemUsers);
  const [users, setUsers] = useState(null);

  // FETCH SYSTEM USERS - starting
  useEffect(() => {
    fetchSystemUsers();
  }, []);
  useEffect(() => {
    setUsers(
      systemUsers?.map((user) => ({
        value: String(user?.id), // or user.id (depending on your backend)
        label: String(
          user?.first_name + " " + user?.last_name + " (" + user?.email + ")"
        ), // display name in dropdown
      }))
    );
  }, [systemUsers]);
  // FETCH SYSTEM USERS - ending

  // FORM
  const defaultValues = useMemo(() => CallsFormValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(CallsFormSchema),
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

  const callFor = watch("call_for");
  useEffect(() => {
    const fetchCallForData = async () => {
      setCallForOptionsData([]);
      if (!callFor) return;

      setLoadingCallForOptionsData(true);
      if (callFor === "leads") {
        setCallForLabel(" Lead");
        const response = await POST(crm_endpoints?.crm?.leads?.get);
        if (response?.status === 200 && response?.data?.length > 0) {
          setCallForOptionsData(
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
              const label = name + " (" + contact + ") : " + item?.email;
              return {
                label: String(label),
                value: String(item?.id),
              };
            })
          );
        }
        setLoadingCallForOptionsData(false);
      } else if (callFor === "contacts") {
        setCallForLabel(" Contact");
        const response = await POST(crm_endpoints?.crm?.contacts?.get);

        if (response?.status === 200 && response.data.length > 0) {
          setCallForOptionsData(
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
              const label = name + " (" + contact + ") : " + item?.email;
              return {
                label: String(label),
                value: String(item?.id),
              };
            })
          );
        }

        setLoadingCallForOptionsData(false);
      }
    };
    fetchCallForData();
  }, [callFor]);

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
    if (callFor === "contacts") {
      setShowRelatedTo(true);
    } else {
      setShowRelatedTo(false);
    }
  }, [callFor]);

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        deletable: 0,
        type_id: 1,
        outgoing_status_id: 1,
      };

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
          {/* Call Information */}
          <div className="space-y-10">
            <h2 className="text-md font-semibold text-gray-800 mb-6">
              Call Information
            </h2>

            {/* Owner */}
            <SingleSelectInput
              label="Assigned To"
              options={users}
              value={watch("assigned_to_id")}
              onChange={(option) => handleChange("assigned_to_id", option)}
              error={errors.assigned_to_id?.message}
              clearError={() => clearErrors("assigned_to_id")}
            />

            {/* Row 1: Call For */}
            <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
              <div className="col-span-6 sm:col-span-2">
                <SingleSelectInput
                  label="Call For"
                  options={RECORD_FOR_OPTIONS}
                  value={watch("call_for")}
                  onChange={(option) => handleChange("call_for", option)}
                  error={errors.call_for?.message}
                  clearError={() => clearErrors("call_for")}
                />
              </div>
              <div className="col-span-6 sm:col-span-4">
                <SingleSelectInput
                  label={`Select ${callForLabel}`}
                  options={callForOptionsData}
                  value={watch("call_for_id")}
                  onChange={(option) => handleChange("call_for_id", option)}
                  error={errors.call_for_id?.message}
                  clearError={() => clearErrors("call_for_id")}
                  loading={loadingCallForOptionsData}
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

            {/* Row 2: Call Type + Status */}
            <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
              <div className="col-span-6 sm:col-span-3">
                <SingleSelectInput
                  label="Call Type"
                  options={CALLS_TYPES_OPTIONS}
                  value={"1"}
                  disabled={true}
                  onChange={(option) => handleChange("type_id", option)}
                  error={errors.type_id?.message}
                  clearError={() => clearErrors("type_id")}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <SingleSelectInput
                  label="Outgoing Call Status"
                  options={CALLS_OUTGOING_STATUS_OPTIONS}
                  value={"1"}
                  disabled={true}
                  onChange={(option) =>
                    handleChange("outgoing_status_id", option)
                  }
                  error={errors.outgoing_status_id?.message}
                  clearError={() => clearErrors("outgoing_status_id")}
                />
              </div>
            </div>

            {/* Row 3: Misc fields */}
            <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
              <div className="col-span-6 sm:col-span-3">
                <DateTimePickerInput
                  label="Call Start Time"
                  value={watch("start_time")}
                  onChange={(option) => handleChange("start_time", option)}
                  error={errors.start_time?.message}
                  clearError={() => clearErrors("start_time")}
                  minDateTime={new Date().toISOString()}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <DateTimePickerInput
                  label="Call End Time"
                  value={watch("end_time")}
                  onChange={(option) => handleChange("end_time", option)}
                  error={errors.end_time?.message}
                  clearError={() => clearErrors("end_time")}
                  minDateTime={new Date().toISOString()}
                />
              </div>
            </div>

            <div className="space-y-8">
              <SingleSelectInput
                label="Call Owner"
                options={users}
                value={watch("owner_id")}
                onChange={(option) => handleChange("owner_id", option)}
                error={errors.owner_id?.message}
                clearError={() => clearErrors("owner_id")}
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
                label="Reminder"
                options={REMINDER_OPTIONS}
                value={watch("reminder_id")}
                onChange={(option) => handleChange("reminder_id", option)}
                error={errors.reminder_id?.message}
                clearError={() => clearErrors("reminder_id")}
              />

              <SingleSelectInput
                label="Call Status"
                options={CALLS_STATUS_OPTIONS}
                value={watch("status_id")}
                onChange={(option) => handleChange("status_id", option)}
                error={errors.status_id?.message}
                clearError={() => clearErrors("status_id")}
              />
            </div>
          </div>

          {/* Purpose Section */}
          <div className="space-y-10">
            <h2 className="text-md font-semibold text-gray-800">
              Purpose Of Outgoing Call
            </h2>
            <SingleSelectInput
              label="Call Purpose"
              options={CALLS_PURPOSE_OPTIONS}
              value={watch("purpose_id")}
              onChange={(option) => handleChange("purpose_id", option)}
              error={errors.purpose_id?.message}
              clearError={() => clearErrors("purpose_id")}
            />
            <TextInput
              label="Call Agenda"
              type="text"
              value={watch("agenda")}
              error={errors.agenda?.message}
              {...register("agenda")}
              maxLength={500}
            />
          </div>

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
              {mode === "log" ? "Log" : "Schedule"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
export const CallsFormValues = (record) => ({
  id: record?.id ?? 0,
  assigned_to_id: record?.assigned_to_id?.toString() ?? "",
  closed: record?.closed ?? 0,
  call_for: record?.call_for?.toString() ?? "",
  call_for_id: record?.call_for_id?.toString() ?? "",
  related_to: record?.related_to?.toString() ?? "",
  related_to_id: record?.related_to_id?.toString() ?? "",
  type_id: record?.type_id?.toString() ?? "",
  outgoing_status_id: record?.outgoing_status_id?.toString() ?? "",
  status_id: record?.status_id?.toString() ?? "",
  start_time: record?.start_time ?? "",
  end_time: record?.end_time ?? "",
  owner_id: record?.owner_id?.toString() ?? "",
  subject: record?.subject ?? "",
  reminder_id: record?.reminder_id?.toString() ?? "",
  purpose_id: record?.purpose_id?.toString() ?? "",
  agenda: record?.agenda ?? "",
});

// Reusable required string helper
const requiredString = (field) =>
  z.string().min(1, { message: `${field} is required` });

export const CallsFormSchema = z
  .object({
    id: z.number().default(0),
    closed: z.number().default(0),

    call_for: requiredString("Call for"),
    call_for_id: requiredString("Call for ID"),
    start_time: requiredString("Start time"),
    end_time: z.string().optional().nullable(),

    related_to: z.string().optional().nullable(),
    related_to_id: z.string().optional().nullable(),

    status_id: requiredString("Call Status"),

    owner_id: requiredString("Owner"),
    assigned_to_id: z.string().optional().or(z.literal("")),

    reminder_id: requiredString("Reminder"),
    purpose_id: requiredString("Purpose"),

    subject: z.string().optional(),
    agenda: z.string().optional(),
  })
  // Rule 1: If call_for = contacts → related_to fields required
  .refine(
    (data) => {
      if (data.call_for === "contacts") {
        return !!data.related_to && !!data.related_to_id;
      }
      return true;
    },
    {
      message:
        "Related To and Related To ID are required when Call For is 'contacts'",
      path: ["related_to"],
    }
  )
  // Rule 2: End time must be greater than start time
.refine(
  (data) => {
    if (!data.start_time || !data.end_time) return true;

    const start = new Date(data.start_time);
    const end = new Date(data.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    return end > start;
  },
  {
    message: "End time must be greater than start time",
    path: ["end_time"],
  }
);






/*
export const CallsFormSchema = z
  .object({
    id: z.number().default(0),
    closed: z.number().default(0),

    call_for: requiredString("Call for"),
    call_for_id: requiredString("Call for ID"),
    start_time: requiredString("Start time"),
    end_time: z.string().optional().nullable(),

    related_to: z.string().optional().nullable(),
    related_to_id: z.string().optional().nullable(),

    //type_id: requiredString("Call type"),
    //status_id: requiredString("Status"),
    status_id: requiredString("Call Status"),

    owner_id: requiredString("Owner"),
    assigned_to_id: z.string().optional().or(z.literal("")),
    
    reminder_id: requiredString("Reminder"),
    purpose_id: requiredString("Purpose"),

    subject: z.string().optional(),
    agenda: z.string().optional(),
  })
  .refine(
    (data) => {
      // If call_for === "contacts", then related_to & related_to_id are required
      if (data.call_for === "contacts") {
        return !!data.related_to && !!data.related_to_id;
      }
      return true; // otherwise valid
    },
    {
      message:
        "Related To and Related To ID are required when Call For is 'contacts'",
      path: ["related_to"], // attaches error to related_to field
    }
  );
*/


