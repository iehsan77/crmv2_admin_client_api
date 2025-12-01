"use client";

import * as React from "react";
import { format, isBefore, isAfter, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // optional helper; replace with your own if needed

/**
 * DateRangePicker (Tailwind + shadcn)
 *
 * Props:
 * - value: {from: Date|null, to: Date|null}   (controlled)
 * - defaultValue: same shape                  (uncontrolled init)
 * - onChange: (range) => void                 (fires on Apply or Clear)
 * - onOpenChange?: (boolean) => void
 * - disabled?: boolean
 * - readOnly?: boolean
 * - placeholder?: string
 * - formatString?: string (default: "LLL d, yyyy")
 * - numberOfMonths?: number (default: 2)
 * - minDate?: Date
 * - maxDate?: Date
 * - disabledDays?: DayPicker "disabled" prop (fn or array)
 * - weekStartsOn?: 0-6
 * - presets?: [{ label: string, getRange: () => ({from:Date,to:Date}) }]
 * - allowClear?: boolean (default: true)
 * - closeOnApply?: boolean (default: true)
 *
 * Notes:
 * - Uses temp state while the popover is open. Commits on "Apply".
 * - "Cancel" discards temp changes.
 * - "Clear" sets value to {from:null, to:null}.
 */

export default function DateRangePicker({
  value,
  defaultValue = { from: null, to: null },
  onChange,
  onOpenChange,
  disabled,
  readOnly,
  placeholder = "Select date range",
  formatString = "LLL d, yyyy",
  numberOfMonths = 2,
  minDate,
  maxDate,
  disabledDays,
  weekStartsOn = 1, // Monday
  presets = [],
  defaultPresets = false,
  allowClear = true,
  closeOnApply = true,
  className,
  triggerClassName,
  name, // optional name for forms
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const applied = isControlled ? value : internal;

  const [open, setOpen] = React.useState(false);
  const [temp, setTemp] = React.useState(applied ?? { from: null, to: null });

  React.useEffect(() => {
    if (open) setTemp(applied ?? { from: null, to: null });
  }, [open]); // reset temp each time it opens

  // Sync temp if parent controls value and it changes while closed
  React.useEffect(() => {
    if (!open && isControlled) setTemp(value ?? { from: null, to: null });
  }, [value, open, isControlled]);

  const commit = (range) => {
    if (isControlled) {
      onChange?.(range);
    } else {
      setInternal(range);
      onChange?.(range);
    }
  };

  const handleApply = () => {
    // clamp to min/max if provided
    let next = { ...temp };
    if (minDate && next.from && isBefore(next.from, minDate))
      next.from = minDate;
    if (maxDate && next.to && isAfter(next.to, maxDate)) next.to = maxDate;

    commit(next);
    if (closeOnApply) setOpen(false);
  };

  const handleCancel = () => {
    setTemp(applied ?? { from: null, to: null });
    setOpen(false);
  };

  const handleClear = () => {
    const empty = { from: null, to: null };
    setTemp(empty);
    commit(empty);
    // setOpen(false);
  };

  const displayLabel = React.useMemo(() => {
    const r = applied;
    if (r?.from && r?.to)
      return `${format(r.from, formatString)} to ${format(r.to, formatString)}`;
    if (r?.from) return format(r.from, formatString);
    return placeholder;
  }, [applied, placeholder, formatString]);

  // compose DayPicker disabled rules
  const disabledRule = React.useMemo(() => {
    const arr = [];
    if (minDate) arr.push({ before: minDate });
    if (maxDate) arr.push({ after: maxDate });
    if (disabledDays) arr.push(disabledDays);
    return arr.length ? arr : undefined;
  }, [minDate, maxDate, disabledDays]);

  const today = startOfToday();

  const DefaultPresets = [
    { label: "Today", getRange: () => ({ from: today, to: today }) },
    {
      label: "Last 7 days",
      getRange: () => {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        return { from, to: today };
      },
    },
    {
      label: "This Month",
      getRange: () => {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: first, to: last };
      },
    },
    {
      label: "Prev Month",
      getRange: () => {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: first, to: last };
      },
    },
  ];

  const allPresets = presets.length
    ? presets
    : defaultPresets
    ? DefaultPresets
    : [];

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden input for plain forms if 'name' provided */}
      {name ? (
        <input
          type="hidden"
          name={`${name}[from]`}
          value={applied?.from ? applied.from.toISOString() : ""}
          readOnly
        />
      ) : null}
      {name ? (
        <input
          type="hidden"
          name={`${name}[to]`}
          value={applied?.to ? applied.to.toISOString() : ""}
          readOnly
        />
      ) : null}

      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          onOpenChange?.(o);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            className={cn(
              "w-full justify-between font-normal border",
              "data-[state=open]:ring-2 data-[state=open]:ring-primary/30",
              triggerClassName
            )}
            aria-label="Open date range picker"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "truncate",
                  !applied?.from && "text-muted-foreground"
                )}
              >
                {displayLabel}
              </span>
            </span>
            <div className="flex items-center gap-1">
              {allowClear && applied?.from && (
                <button
                  type="button"
                  aria-label="Clear date range"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-auto p-0 rounded-2xl shadow-xl border"
        >
          <div className="flex flex-col w-fit max-w-[95vw] sm:max-w-[90vw] overflow-x-auto">
            {/* Header */}
            <div className="px-4 pt-4 pb-2 text-sm font-medium text-muted-foreground">
              {temp?.from && temp?.to ? (
                <>
                  {format(temp.from, formatString)} →{" "}
                  {format(temp.to, formatString)}
                </>
              ) : (
                "Pick a start and end date"
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 px-4 pb-4">
              {/* Presets */}
              {allPresets?.length ? (
                <div className="sm:w-48 w-full border rounded-xl p-2 h-[284px] overflow-auto bg-muted/30">
                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground">
                    Quick ranges
                  </div>
                  <ul className="space-y-1">
                    {allPresets.map((p) => (
                      <li key={p.label}>
                        <button
                          type="button"
                          className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => setTemp(p.getRange())}
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Calendar */}
              <div className="grow rounded-xl border overflow-x-auto">
                <div className="min-w-[320px] sm:min-w-0">
                  <Calendar
                    mode="range"
                    numberOfMonths={numberOfMonths}
                    selected={temp}
                    onSelect={setTemp}
                    ISOWeek
                    weekStartsOn={weekStartsOn}
                    disabled={disabledRule}
                    initialFocus
                    captionLayout="buttons"
                    navLayout="around"
                    className="p-2"
                    classNames={{
                      months: "flex flex-col sm:flex-row gap-4",
                      month: "space-y-2",
                      caption: "flex justify-between items-center px-2 pt-2",
                      caption_label: "text-sm font-semibold",
                      nav: "flex items-center gap-1",
                      nav_button: "h-7 w-7 rounded-md hover:bg-muted",
                      table: "w-full border-collapse",
                      head_row: "grid grid-cols-7",
                      head_cell:
                        "text-[11px] font-semibold text-muted-foreground",
                      row: "grid grid-cols-7",
                      cell: "h-9 w-9 p-0 text-center align-middle",
                      day: "h-9 w-9 rounded-md hover:bg-muted focus-visible:outline-none",
                      selected:
                        "bg-primary hover:bg-primary/90 hover:text-white",
                      range_middle: "bg-primary/10",
                      range_start: "bg-primary text-white",
                      range_end: "bg-primary text-white",
                      outside: "opacity-40",
                      disabled: "opacity-30 cursor-not-allowed",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemp({ from: today, to: today })}
                >
                  Today
                </Button>
                {allowClear && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  className="px-6"
                  disabled={!temp?.from}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>

        {/* <PopoverContent
          align="end"
          className="w-auto p-0 rounded-2xl shadow-xl border"
        >
          <div className="flex flex-col w-fit max-w-[90vw]">
            header (matches your design vibe)
            <div className="px-4 pt-4 pb-2 text-sm font-medium text-muted-foreground">
              {temp?.from && temp?.to ? (
                <>
                  {format(temp.from, formatString)} →{" "}
                  {format(temp.to, formatString)}
                </>
              ) : (
                "Pick a start and end date"
              )}
            </div>

            <div className="flex gap-4 px-4 pb-4">
              Presets
              {allPresets?.length ? (
                <div className="w-48 shrink-0 border rounded-xl p-2 h-[284px] overflow-auto bg-muted/30">
                  <div className="text-xs font-semibold px-2 py-1 text-muted-foreground">
                    Quick ranges
                  </div>
                  <ul className="space-y-1">
                    {allPresets.map((p) => (
                      <li key={p.label}>
                        <button
                          type="button"
                          className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => setTemp(p.getRange())}
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              Calendar
              <div className="grow rounded-xl border">
                <Calendar
                  mode="range"
                  numberOfMonths={numberOfMonths}
                  selected={temp}
                  onSelect={setTemp}
                  ISOWeek
                  weekStartsOn={weekStartsOn}
                  disabled={disabledRule}
                  initialFocus
                  // show outside days + nav buttons by default (react-day-picker)
                  captionLayout="buttons"
                  navLayout="around"
                  className="p-2"
                  classNames={{
                    months: "flex gap-4",
                    month: "space-y-2",
                    caption: "flex justify-between items-center px-2 pt-2",
                    caption_label: "text-sm font-semibold",
                    nav: "flex items-center gap-1",
                    nav_button: "h-7 w-7 rounded-md hover:bg-muted",
                    table: "w-full border-collapse",
                    head_row: "grid grid-cols-7",
                    head_cell:
                      "text-[11px] font-semibold text-muted-foreground",
                    row: "grid grid-cols-7",
                    cell: "h-9 w-9 p-0 text-center align-middle",
                    day: "h-9 w-9 rounded-md hover:bg-muted focus-visible:outline-none",
                    selected: "bg-primary hover:bg-primary/90 hover:text-white",
                    range_middle: "bg-primary/10",
                    range_start: "bg-primary text-white",
                    range_end: "bg-primary text-white",
                    outside: "opacity-40",
                    disabled: "opacity-30 cursor-not-allowed",
                  }}
                />
              </div>
            </div>

            footer actions
            <div className="border-t px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemp({ from: today, to: today })}
                >
                  Today
                </Button>
                {allowClear && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  className="px-6"
                  disabled={!temp?.from}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent> */}
      </Popover>
    </div>
  );
}
