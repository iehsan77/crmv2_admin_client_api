"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // utility for conditional classes
import { CalendarIcon } from "lucide-react";
import { useFormContext, Controller } from "react-hook-form";
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

CalendarInput.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  dateFormat: PropTypes.string,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  vertical: PropTypes.bool,
};

export default function CalendarInput({
  name,
  title,
  placeholder = "Pick a date",
  className,
  dateFormat = "dd/MM/yyyy",
  minDate,
  maxDate,
  vertical=true,
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ field, fieldState: { error } }) => (
        <div className={`grid md:grid-cols-4 ${vertical ? "gap-1" : "gap-1 md:gap-4"}`}>
          {title && (
            <div className={`text-nowrap ${vertical ? "col-span-4" : "col-span-1 md:text-right"}`}>
              <label className="text-sm text-gray-600 mb-1">{title}</label>
            </div>
          )}
          <div className={`w-full ${vertical ? "col-span-4" : "col-span-3"}`}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !field.value && "text-muted-foreground",
                    className
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, dateFormat) : placeholder}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ShadCalendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                  fromDate={minDate}
                  toDate={maxDate}
                />
              </PopoverContent>
            </Popover>
            {error?.message && <p className="!text-xs text-danger mt-1">{error.message}</p>}
          </div>
        </div>
      )}
    />
  );
}
