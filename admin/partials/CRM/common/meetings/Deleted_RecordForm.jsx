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
  MEETINGS_STATUS_OPTIONS,
  MEETINGS_VENUES,
  RECORD_FOR_OPTIONS,
  RELATED_TO_OPTIONS,
  REMINDER_OPTIONS,
} from "@/constants/crm_constants";

import { crm_endpoints } from "@/utils/crm_endpoints";
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";

import { tryParseJSON } from "@/helper/GeneralFunctions";

import useMeetingsStore from "@/stores/crm/useMeetingsStore";

import { useDrawer } from "@/context/drawer-context";

export default function RecordForm({ record = {} }) {
  console.log("record 36");
  console.log(record);

  const { hideDrawer } = useDrawer();
  const [showRelatedTo, setShowRelatedTo] = useState(false);
  const [owners, setOwners] = useState([]);

  const [meetingForLabel, setMeetingForLabel] = useState("");
  const [meetingForOptionsData, setMeetingForOptionsData] = useState([]);
  const [loadingMeetingForOptionsData, setLoadingMeetingForOptionsData] =
    useState(false);

  const [relatedToLabel, setRelatedToLabel] = useState("");
  const [relatedToOptionsData, setRelatedToOptionsData] = useState([]);
  const [loadingRelatedToOptionsData, setLoadingRelatedToOptionsData] =
    useState(false);

  const [allDay, setAllDay] = useState(false);

  const saveRecord = useMeetingsStore((state) => state.saveRecord);
  const updateRecord = useMeetingsStore((state) => state.updateRecord);

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

  // Fetch meta Data - starting
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await POST(
          crm_endpoints?.settings?.["system-users"]?.get
        );
        if (response?.status === 200) {
          const data = response?.data;
          setOwners(
            data.map((item) => ({
              label: String(
                item?.first_name +
                  " " +
                  item?.last_name +
                  " (" +
                  item?.email +
                  ")"
              ),
              value: String(item?.id),
            }))
          );
        } else {
          toast.error("No owners found");
        }
      } catch (error) {
        console.error("Error fetching owners:", error);
        toast.error("Failed to fetch owners");
      }
    };
    fetchOwners();
  }, []);
  // Fetch meta Data - ending

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        meeting_for_ids: JSON.stringify(formData?.meeting_for_ids) || "",
        participant_ids: JSON.stringify(formData?.participant_ids) || "",
        related_to_ids: JSON.stringify(formData?.related_to_ids) || "",
        deletable: 0,
      };
      //console.log("body 114");  console.log(body);       return false;
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

  const meetingFor = watch("meeting_for");
  useEffect(() => {
    const fetchMeetingForData = async () => {
      setMeetingForOptionsData([]);
      if (!meetingFor) return;

      setLoadingMeetingForOptionsData(true);
      if (meetingFor === "leads") {
        setMeetingForLabel(" Lead");
        const response = await POST(crm_endpoints?.crm?.leads?.get);
        if (response?.status === 200 && response?.data?.length > 0) {
          setMeetingForOptionsData(
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
        setLoadingMeetingForOptionsData(false);
      } else if (meetingFor === "contacts") {
        setMeetingForLabel(" Contact");
        const response = await POST(crm_endpoints?.crm?.contacts?.get);

        if (response?.status === 200 && response.data.length > 0) {
          setMeetingForOptionsData(
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

        setLoadingMeetingForOptionsData(false);
      }
    };
    fetchMeetingForData();
  }, [meetingFor]);

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
    };
    fetchRelatedToData();
  }, [relatedTo]);

  useEffect(() => {
    if (meetingFor === "contacts") {
      setShowRelatedTo(true);
    } else {
      setShowRelatedTo(false);
    }
  }, [meetingFor]);

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <h2 className="text-md font-semibold text-gray-800 mb-6">
            Meetings Information
          </h2>
          <TextInput
            label="Title"
            type="text"
            error={errors.title?.message}
            {...register("title")}
            value={watch("title")}
          />

          <TextInput
            label="Location"
            type="text"
            error={errors.location?.message}
            {...register("location")}
            value={watch("location")}
          />

          <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
            <div className="col-span-6 sm:col-span-3">
              <SingleSelectInput
                label="Meeting Venue"
                options={MEETINGS_VENUES}
                value={watch("venue")}
                onChange={(option) => handleChange("venue", option)}
                error={errors.venue?.message}
                clearError={() => clearErrors("venue")}
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <CheckboxInput
                title="All Day"
                checked={watch("all_day")}
                {...register("all_day")}
                error={errors?.all_day?.message}
              />
            </div>
          </div>

          {watch("all_day") ? (
            <>
              <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
                <div className="col-span-6 sm:col-span-3">
                  <DatePickerInput
                    label="Meeting Start Time"
                    value={watch("start_time")}
                    onChange={(option) => handleChange("start_time", option)}
                    error={errors.start_time?.message}
                    clearError={() => clearErrors("start_time")}
                    minDateTime={new Date().toISOString()}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <DatePickerInput
                    label="Meeting End Time"
                    value={watch("end_time")}
                    onChange={(option) => handleChange("end_time", option)}
                    error={errors.end_time?.message}
                    clearError={() => clearErrors("end_time")}
                    minDateTime={new Date().toISOString()}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
                <div className="col-span-6 sm:col-span-3">
                  <DateTimePickerInput
                    label="Meeting Start Time"
                    value={watch("start_time")}
                    onChange={(option) => handleChange("start_time", option)}
                    error={errors.start_time?.message}
                    clearError={() => clearErrors("start_time")}
                    minDateTime={new Date().toISOString()}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <DateTimePickerInput
                    label="Meeting End Time"
                    value={watch("end_time")}
                    onChange={(option) => handleChange("end_time", option)}
                    error={errors.end_time?.message}
                    clearError={() => clearErrors("end_time")}
                    minDateTime={new Date().toISOString()}
                  />
                </div>
              </div>
            </>
          )}

          <SingleSelectInput
            label="Meeting Owner"
            options={owners}
            value={watch("owner_id")}
            onChange={(option) => handleChange("owner_id", option)}
            error={errors.owner_id?.message}
            clearError={() => clearErrors("owner_id")}
          />

          <SingleSelectInput
            label="Meeting Status"
            options={MEETINGS_STATUS_OPTIONS}
            value={watch("status_id")}
            onChange={(option) => handleChange("status_id", option)}
            error={errors.status_id?.message}
            clearError={() => clearErrors("status_id")}
          />

          <h2 className="text-md font-semibold text-gray-800">
            Participant_ids
          </h2>
          <MultiSelectInput
            label="Participants"
            options={owners}
            value={watch("participant_ids")}
            onChange={(option) => handleChange("participant_ids", option)}
            error={errors.participant_ids?.message}
            clearError={() => clearErrors("participant_ids")}
          />

          {/* Row 1: Meeting For */}
          <div className="grid sm:grid-cols-6 gap-x-6 gap-y-8">
            <div className="col-span-6 sm:col-span-2">
              <SingleSelectInput
                label="Meeting For"
                options={RECORD_FOR_OPTIONS}
                value={watch("meeting_for")}
                onChange={(option) => handleChange("meeting_for", option)}
                error={errors.meeting_for?.message}
                clearError={() => clearErrors("meeting_for")}
              />
            </div>
            <div className="col-span-6 sm:col-span-4">
              <MultiSelectInput
                label={`Select ${meetingForLabel}`}
                options={meetingForOptionsData}
                value={watch("meeting_for_ids")}
                onChange={(option) => handleChange("meeting_for_ids", option)}
                error={errors.meeting_for_ids?.message}
                clearError={() => clearErrors("meeting_for_ids")}
                loading={loadingMeetingForOptionsData}
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
                <MultiSelectInput
                  label={`Select ${relatedToLabel}`}
                  options={relatedToOptionsData}
                  value={watch("related_to_ids")}
                  onChange={(option) => handleChange("related_to_ids", option)}
                  error={errors.related_to_ids?.message}
                  clearError={() => clearErrors("related_to_ids")}
                  loading={loadingRelatedToOptionsData}
                />
              </div>
            </div>
          )}
          <SingleSelectInput
            label="Participants Reminder"
            options={REMINDER_OPTIONS}
            value={watch("reminder_id")}
            onChange={(option) => handleChange("reminder_id", option)}
            error={errors.reminder_id?.message}
            clearError={() => clearErrors("reminder_id")}
          />
          <TextInput
            label="Description"
            type="text"
            error={errors.description?.message}
            {...register("description")}
            value={watch("description")}
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
export const FormValues = (record) => ({
  id: record?.id ?? 0,
  title: record?.title ?? "",
  venue: record?.venue ?? "",
  location: record?.location ?? "",
  start_time: record?.start_time ?? "",
  end_time: record?.end_time ?? "",
  all_day: record?.all_day === 1 ? true : false,
  owner_id: record?.owner_id?.toString() ?? "",
  participant_ids: tryParseJSON(record?.participant_ids) ?? [],
  status_id: record?.status_id?.toString() ?? "1",
  meeting_for: record?.meeting_for?.toString() ?? "",
  meeting_for_ids: tryParseJSON(record.meeting_for_ids),
  related_to: record?.related_to?.toString() ?? "",
  related_to_ids: tryParseJSON(record.related_to_ids),
  reminder_id: record?.reminder_id?.toString() ?? "",
  description: record?.description ?? "",
});

// Reusable required string helper
const requiredString = (field) =>
  z.string().min(1, { message: `${field} is required` });

// Form validation schema
export const FormSchema = z
  .object({
    id: z.number().default(0),

    title: requiredString("Title"),
    venue: requiredString("Meeting venue"),
    location: requiredString("Location"),

    start_time: requiredString("Start time"),
    end_time: requiredString("End time"),

    all_day: z.boolean().optional().default(false),

    owner_id: requiredString("Owner"),
    participant_ids: z.array(z.any()).optional().default([]),

    //status_id: z.string().optional().default("1"),
    status_id: requiredString("Status"),

    meeting_for: requiredString("Meeting for"),
    meeting_for_ids: z
      .array(z.string().min(1, "Meeting for ID is required"))
      .min(1, { message: "Select at least one Meeting for ID" }),

    related_to: z.string().optional().nullable(),
    related_to_ids: z.array(z.string()).optional().default([]),

    reminder_id: requiredString("Reminder"),
    description: z.string().optional(),
  })

  // Conditional validation for 'contacts'
  .refine(
    (data) => {
      if (data.meeting_for === "contacts") {
        return (
          !!data.related_to &&
          Array.isArray(data.related_to_ids) &&
          data.related_to_ids.length > 0
        );
      }
      return true;
    },
    {
      message:
        "Related To and Related To IDs are required when Meeting For is 'contacts'",
      path: ["related_to_ids"],
    }
  )

  // Ensure end_time > start_time
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;

      // Handle both date-time and time-only strings
      const start = new Date(`1970-01-01T${data.start_time}`);
      const end = new Date(`1970-01-01T${data.end_time}`);

      // If the user provides full date-time strings, use them directly
      const startDate = isNaN(start.getTime())
        ? new Date(data.start_time)
        : start;
      const endDate = isNaN(end.getTime()) ? new Date(data.end_time) : end;

      return endDate > startDate;
    },
    {
      message: "End time must be greater than start time",
      path: ["end_time"],
    }
  );
