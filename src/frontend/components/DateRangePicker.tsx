import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import "./DateRangePicker.css";

interface DateRangePickerProps {
  fromValue?: string;
  toValue?: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

const MONTH_NAMES_GENITIVE = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const TODAY = new Date();

const parseIsoDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatUkDate = (value?: string): string => {
  const date = parseIsoDate(value);
  if (!date) {
    return "";
  }

  return `${date.getDate()} ${MONTH_NAMES_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
};

const isSameDate = (left: Date | null, right: Date | null): boolean => {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

const isDateBetween = (
  date: Date,
  from: Date | null,
  to: Date | null,
): boolean => {
  if (!from || !to) {
    return false;
  }

  return date > from && date < to;
};

const clampToBounds = (date: Date, min?: string, max?: string): Date => {
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);

  if (minDate && date < minDate) {
    return minDate;
  }

  if (maxDate && date > maxDate) {
    return maxDate;
  }

  return date;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  disabled = false,
  min,
  max,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to">("from");
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const fromDate = parseIsoDate(fromValue);
  const toDate = parseIsoDate(toValue);
  const initialDate = clampToBounds(fromDate || toDate || TODAY, min, max);
  const [displayMonth, setDisplayMonth] = useState(initialDate.getMonth());
  const [displayYear, setDisplayYear] = useState(initialDate.getFullYear());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncedDate = clampToBounds(fromDate || toDate || TODAY, min, max);
    setDisplayMonth(syncedDate.getMonth());
    setDisplayYear(syncedDate.getFullYear());
  }, [fromValue, toValue, min, max]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedPopoverHeight = 356;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPlacement(
        spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow
          ? "up"
          : "down",
      );
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const yearOptions = useMemo(() => {
    const minYear = parseIsoDate(min)?.getFullYear() || 1900;
    const maxYear = parseIsoDate(max)?.getFullYear() || TODAY.getFullYear();
    const years: number[] = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      years.push(year);
    }
    return years;
  }, [min, max]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: Array<{ date: Date | null; disabled: boolean }> = [];
    const minDate = parseIsoDate(min);
    const maxDate = parseIsoDate(max);

    for (let index = 0; index < firstWeekday; index += 1) {
      days.push({ date: null, disabled: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(displayYear, displayMonth, day);
      const disabledDay =
        (minDate && date < minDate) || (maxDate && date > maxDate) || false;
      days.push({ date, disabled: disabledDay });
    }

    while (days.length < 42) {
      days.push({ date: null, disabled: true });
    }

    return days;
  }, [displayMonth, displayYear, min, max]);

  const rangeLabel =
    fromValue && toValue
      ? `${formatUkDate(fromValue)} - ${formatUkDate(toValue)}`
      : "Оберіть період";

  const applyDate = (date: Date) => {
    const iso = toIsoDate(date);

    if (activeField === "from") {
      onFromChange(iso);
      if (toDate && date > toDate) {
        onToChange(iso);
      }
      setActiveField("to");
      return;
    }

    onToChange(iso);
    if (fromDate && date < fromDate) {
      onFromChange(iso);
    }
    setIsOpen(false);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const nextDate = clampToBounds(
      new Date(displayYear, displayMonth + direction, 1),
      min,
      max,
    );
    setDisplayMonth(nextDate.getMonth());
    setDisplayYear(nextDate.getFullYear());
  };

  const openPicker = () => {
    const focusDate = clampToBounds(
      (activeField === "from" ? fromDate : toDate) ||
        fromDate ||
        toDate ||
        TODAY,
      min,
      max,
    );

    setDisplayMonth(focusDate.getMonth());
    setDisplayYear(focusDate.getFullYear());
    setIsOpen((current) => !current);
  };

  return (
    <div className="date-range-picker" ref={rootRef}>
      <button
        type="button"
        className={`date-range-picker__trigger ${isOpen ? "open" : ""}`}
        onClick={openPicker}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <CalendarDays size={18} />
        <div className="date-range-picker__trigger-copy">
          <span className="date-range-picker__trigger-label">Період</span>
          <strong>{rangeLabel}</strong>
        </div>
      </button>

      {isOpen && (
        <div
          className={`date-range-picker__popover ${placement === "up" ? "open-up" : "open-down"}`}
        >
          <div className="date-range-picker__summary">
            <button
              type="button"
              className={`date-range-chip ${activeField === "from" ? "active" : ""}`}
              onClick={() => setActiveField("from")}
            >
              <span>Від</span>
              <strong>{formatUkDate(fromValue) || "Не обрано"}</strong>
            </button>
            <button
              type="button"
              className={`date-range-chip ${activeField === "to" ? "active" : ""}`}
              onClick={() => setActiveField("to")}
            >
              <span>До</span>
              <strong>{formatUkDate(toValue) || "Не обрано"}</strong>
            </button>
          </div>

          <div className="date-range-picker__selectors">
            <select
              className="date-range-picker__select"
              value={displayMonth}
              onChange={(event) => setDisplayMonth(Number(event.target.value))}
            >
              {MONTH_NAMES.map((monthName, index) => (
                <option key={monthName} value={index}>
                  {monthName}
                </option>
              ))}
            </select>
            <select
              className="date-range-picker__select"
              value={displayYear}
              onChange={(event) => setDisplayYear(Number(event.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="date-range-picker__shortcut"
              onClick={() => {
                const today = clampToBounds(TODAY, min, max);
                applyDate(today);
                setDisplayMonth(today.getMonth());
                setDisplayYear(today.getFullYear());
              }}
            >
              Сьогодні
            </button>
          </div>

          <div className="date-range-picker__navigation">
            <button
              type="button"
              className="date-range-picker__nav"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-range-picker__title">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </div>
            <button
              type="button"
              className="date-range-picker__nav"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-range-picker__weekdays">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="date-range-picker__days">
            {calendarDays.map((dayItem, index) => {
              const date = dayItem.date;
              const isSelectedStart = isSameDate(date, fromDate);
              const isSelectedEnd = isSameDate(date, toDate);
              const isInRange = date
                ? isDateBetween(date, fromDate, toDate)
                : false;
              const isToday = isSameDate(date, TODAY);

              return (
                <button
                  key={`${date ? toIsoDate(date) : `empty-${index}`}`}
                  type="button"
                  className={`date-range-picker__day ${!date ? "empty" : ""} ${dayItem.disabled && date ? "out-of-range" : ""} ${isToday ? "today" : ""} ${isSelectedStart ? "selected-start" : ""} ${isSelectedEnd ? "selected-end" : ""} ${isInRange ? "in-range" : ""}`}
                  disabled={dayItem.disabled || !date}
                  onClick={() => date && applyDate(date)}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-range-picker__footer">
            <div className="date-range-picker__actions">
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={() => {
                  onFromChange("");
                  onToChange("");
                  setActiveField("from");
                }}
              >
                <RotateCcw size={14} />
                Скинути
              </button>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setIsOpen(false)}
              >
                Застосувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
