"use client";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import CheckboxInput from "./CheckboxInput";
import { cn } from "@/lib/utils";
import { daysOfWeek } from "@/mock/daysOfWeek";

export default function WeekTimingInput({ name = "timing" }) {
  const { control, setValue, watch, formState } = useFormContext();
  const { errors, touchedFields, isSubmitted } = formState;

  const watchedTimings = watch(name) || [];
  const fieldErrors = errors?.[name];

  useEffect(() => {
    if (!watchedTimings.length) {
      setValue(
        name,
        daysOfWeek.map((day) => ({
          day,
          open: "00:00",
          close: "00:00",
          closed: false,
        }))
      );
    }
  }, [setValue, name, watchedTimings]);

  const handleTimeChange = (index, field, value) => {
    const updated = [...watchedTimings];
    updated[index][field] = value;
    setValue(name, updated, { shouldValidate: true, shouldTouch: true });
  };

  const toggleClosed = (index) => {
    const updated = [...watchedTimings];
    updated[index].closed = !updated[index].closed;
    if (updated[index].closed) {
      updated[index].open = "00:00";
      updated[index].close = "00:00";
    }
    setValue(name, updated, { shouldValidate: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <div className="divide-y divide-gray-100">
          {watchedTimings.map((timing, index) => {
            const isTouched =
              touchedFields?.[name]?.[index]?.open ||
              touchedFields?.[name]?.[index]?.close ||
              isSubmitted;

            const hasError =
              !timing.closed &&
              (timing.open === "00:00" || timing.close === "00:00") &&
              isTouched;

            const openError = hasError && timing.open === "00:00";
            const closeError = hasError && timing.close === "00:00";

            const fieldError = fieldErrors?.[index];

            return (
              <div key={timing.day} className="flex flex-col gap-2 px-1 py-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-32 bg-gray-light/20 text-center p-2">
                    {timing.day}
                  </div>
                  <div className="flex gap-3 items-center">
                    <input
                      type="time"
                      value={timing.open}
                      disabled={timing.closed}
                      onChange={(e) =>
                        handleTimeChange(index, "open", e.target.value)
                      }
                      className={cn(
                        "text-sm rounded-md px-2 py-1 w-[120px] disabled:opacity-50 outline-0 border",
                        openError ? "border-red-500" : "border-gray-300"
                      )}
                    />

                    <span className="text-gray-400">—</span>

                    <input
                      type="time"
                      value={timing.close}
                      disabled={timing.closed}
                      onChange={(e) =>
                        handleTimeChange(index, "close", e.target.value)
                      }
                      className={cn(
                        "text-sm rounded-md px-2 py-1 w-[120px] disabled:opacity-50 outline-0 border",
                        closeError ? "border-red-500" : "border-gray-300"
                      )}
                    />
                  </div>

                  <CheckboxInput
                    title="Closed"
                    checked={timing.closed}
                    onChange={() => toggleClosed(index)}
                  />
                </div>
                {hasError && (
                  <p className="text-red-500 text-xs text-center">
                    {fieldError?.open?.message ||
                      fieldError?.close?.message ||
                      "Open & Close are required if not closed"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    />
  );
}