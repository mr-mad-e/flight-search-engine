/**
 * Date Picker Components
 * Single date and date range selection with flexible dates hint
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import { useController, UseControllerProps } from "react-hook-form";

interface DatePickerProps extends Omit<UseControllerProps<any>, "render"> {
  placeholder?: string;
  label?: string;
  minDate?: Date;
  disabled?: boolean;
  showFlexibleDatesHint?: boolean;
  className?: string;
  onChange?: (date: string) => void;
}

interface DateRangePickerProps extends Omit<UseControllerProps<any>, "render"> {
  startLabel?: string;
  endLabel?: string;
  minDate?: Date;
  disabled?: boolean;
  showFlexibleDatesHint?: boolean;
  onRangeChange?: (range: { start: string; end: string }) => void;
}

/**
 * Calendar component
 */
interface CalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  selectedDates: Set<string>;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

function Calendar({
  month,
  onMonthChange,
  selectedDates,
  onDateSelect,
  minDate,
  maxDate,
  disabled,
}: CalendarProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month);
  const firstDay = getFirstDayOfMonth(month);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i));
  }

  const today = startOfDay(new Date());
  const effectiveMinDate = minDate || today;

  const handlePrevMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const isDayDisabled = (date: Date) => {
    return (
      isBefore(date, effectiveMinDate) || (maxDate && isAfter(date, maxDate))
    );
  };

  const isDaySelected = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return selectedDates.has(key);
  };

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          type="button"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          type="button"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (date === null) {
            return <div key={`empty-${index}`} />;
          }

          const isDisabled = isDayDisabled(date);
          const isSelected = isDaySelected(date);
          const isToday =
            format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

          return (
            <button
              key={format(date, "yyyy-MM-dd")}
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled || disabled}
              className={`
                w-full aspect-square rounded-md text-sm font-medium transition-colors
                ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : isToday
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-900"
                }
                ${
                  isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "hover:bg-gray-100 cursor-pointer"
                }
              `}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Popover component
 */
interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

function Popover({ isOpen, onClose, trigger, children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div className="relative">
      <div ref={triggerRef}>{trigger}</div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Single Date Picker Component (standalone)
 */
interface DatePickerStandaloneProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  showFlexibleDatesHint?: boolean;
  label?: string;
}

export function DatePickerStandalone({
  value,
  onChange,
  placeholder = "Select date...",
  minDate,
  disabled = false,
  showFlexibleDatesHint = true,
  label,
}: DatePickerStandaloneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    value ? new Date(value) : new Date(),
  );
  const today = startOfDay(new Date());
  const effectiveMinDate = minDate || today;

  const selectedDates = new Set(value ? [value] : []);
  const displayValue = value ? format(new Date(value), "MMM dd, yyyy") : "";

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    onChange(dateString);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}

      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        trigger={
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <span
                className={displayValue ? "text-gray-900" : "text-gray-500"}
              >
                {displayValue || placeholder}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </button>
        }
      >
        <Calendar
          month={month}
          onMonthChange={setMonth}
          selectedDates={selectedDates}
          onDateSelect={handleDateSelect}
          minDate={effectiveMinDate}
          disabled={disabled}
        />

        {showFlexibleDatesHint && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            💡 Tip: Flexible dates can help you find cheaper flights!
          </div>
        )}
      </Popover>
    </div>
  );
}

/**
 * Date Range Picker Component (standalone)
 */
interface DateRangePickerStandaloneProps {
  startDate?: string;
  endDate?: string;
  onRangeChange: (range: { start: string; end: string }) => void;
  startLabel?: string;
  endLabel?: string;
  minDate?: Date;
  disabled?: boolean;
  showFlexibleDatesHint?: boolean;
}

export function DateRangePickerStandalone({
  startDate,
  endDate,
  onRangeChange,
  startLabel = "Departure",
  endLabel = "Return",
  minDate,
  disabled = false,
  showFlexibleDatesHint = true,
}: DateRangePickerStandaloneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    startDate ? new Date(startDate) : new Date(),
  );
  const [selectingEnd, setSelectingEnd] = useState(false);
  const today = startOfDay(new Date());
  const effectiveMinDate = minDate || today;

  const selectedDates = new Set<string>();
  if (startDate) selectedDates.add(startDate);
  if (endDate) selectedDates.add(endDate);

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");

    if (!startDate || (startDate && endDate)) {
      // Select start date
      onRangeChange({ start: dateString, end: "" });
      setSelectingEnd(false);
    } else if (!endDate) {
      // Select end date
      if (
        isAfter(date, new Date(startDate)) ||
        format(date, "yyyy-MM-dd") === startDate
      ) {
        onRangeChange({ start: startDate, end: dateString });
        setIsOpen(false);
      } else {
        // Date is before start date, set as new start
        onRangeChange({ start: dateString, end: "" });
      }
    }
  };

  const maxDate = startDate ? addDays(new Date(startDate), 365) : undefined;

  return (
    <div className="space-y-3">
      {/* Start date */}
      <div>
        <label className="block text-sm font-medium mb-1">{startLabel}</label>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setSelectingEnd(false);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <div className="flex items-center justify-between">
            <span className={startDate ? "text-gray-900" : "text-gray-500"}>
              {startDate
                ? format(new Date(startDate), "MMM dd, yyyy")
                : "Select date..."}
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* End date */}
      {startDate && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {endLabel} (Optional)
          </label>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setSelectingEnd(true);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <div className="flex items-center justify-between">
              <span className={endDate ? "text-gray-900" : "text-gray-500"}>
                {endDate
                  ? format(new Date(endDate), "MMM dd, yyyy")
                  : "Select return date..."}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Calendar popover */}
      {isOpen && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            minDate={
              selectingEnd && startDate ? new Date(startDate) : effectiveMinDate
            }
            maxDate={maxDate}
            disabled={disabled}
          />

          {showFlexibleDatesHint && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              💡 Tip: Flying mid-week is often cheaper!
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            type="button"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Date Picker with react-hook-form integration
 */
export function DatePicker({
  label,
  placeholder = "Select date...",
  minDate,
  disabled = false,
  showFlexibleDatesHint = true,
  className = "",
  onChange: onChangeCallback,
  control,
  name,
  ...props
}: DatePickerProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    ...props,
  });

  const handleChange = (date: string) => {
    field.onChange(date);
    onChangeCallback?.(date);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-sm font-medium">{label}</label>}

      <DatePickerStandalone
        value={field.value}
        onChange={handleChange}
        placeholder={placeholder}
        minDate={minDate}
        disabled={disabled}
        showFlexibleDatesHint={showFlexibleDatesHint}
        label=""
      />

      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}

/**
 * Date Range Picker with react-hook-form integration
 */
export function DateRangePicker({
  startLabel = "Departure",
  endLabel = "Return",
  minDate,
  disabled = false,
  showFlexibleDatesHint = true,
  onRangeChange: onRangeChangeCallback,
  control,
  name,
  ...props
}: DateRangePickerProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    ...props,
  });

  const [range, setRange] = field.value || { start: "", end: "" };

  const handleRangeChange = (newRange: { start: string; end: string }) => {
    field.onChange(newRange);
    onRangeChangeCallback?.(newRange);
  };

  return (
    <div className="space-y-1">
      <DateRangePickerStandalone
        startDate={range?.start}
        endDate={range?.end}
        onRangeChange={handleRangeChange}
        startLabel={startLabel}
        endLabel={endLabel}
        minDate={minDate}
        disabled={disabled}
        showFlexibleDatesHint={showFlexibleDatesHint}
      />

      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
