import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { eventService } from "../../services/event.service";
import { Event } from "../../types/event.types";
import "../workspace/WorkspacePage.css";
import "./CalendarPage.css";

type CalendarView = "day" | "week" | "month" | "year";

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  sortTime: string;
  description: string;
  participants: string;
  createdAt: string;
  client: string;
  deal: string;
  additionalInfo: string;
  date: Date;
  location: string;
  responsibleContact: string;
  recurrenceLabel: string;
  rangeLabel: string;
};

type PaginatedState = {
  start: string;
  end: string;
  search: string;
  page: number;
  pageSize: number;
};

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
const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const WEEKDAY_FULL = [
  "понеділок",
  "вівторок",
  "середа",
  "четвер",
  "п'ятниця",
  "субота",
  "неділя",
];
const HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

const DEFAULT_PAGE_STATE = (start: Date, end: Date): PaginatedState => ({
  start: formatDate(start),
  end: formatDate(end),
  search: "",
  page: 1,
  pageSize: 10,
});

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHumanDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCreatedAt(value?: string): string {
  if (!value) {
    return "Не вказано";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - (day === 0 ? 6 : day - 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(date: Date): Date {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

function toIsoRange(
  view: CalendarView,
  currentDate: Date,
): { start: Date; end: Date } {
  if (view === "day") {
    return {
      start: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
      ),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  if (view === "week") {
    return {
      start: getStartOfWeek(currentDate),
      end: getEndOfWeek(currentDate),
    };
  }

  if (view === "month") {
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { start: getStartOfWeek(monthStart), end: getEndOfWeek(monthEnd) };
  }

  return {
    start: new Date(currentDate.getFullYear(), 0, 1),
    end: new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999),
  };
}

function normalizeParticipants(event: Event): string {
  if (event.participants && typeof event.participants === "object") {
    const values = Object.values(event.participants)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );

    if (values.length > 0) {
      return values.join(", ");
    }
  }

  return event.judgeName || "Не вказано";
}

function getTimeLabel(time?: string | null, isAllDay?: boolean | null): string {
  if (isAllDay) {
    return "Увесь день";
  }

  return time ? time.slice(0, 5) : "09:00";
}

function getRecurrenceLabel(event: Event): string {
  if (!event.isRecurring || !event.recurrencePattern) {
    return "Не повторюється";
  }

  const interval = event.recurrenceInterval || 1;
  const labels: Record<string, string> = {
    daily: "щодня",
    weekly: "щотижня",
    monthly: "щомісяця",
    yearly: "щороку",
  };

  const baseLabel = labels[event.recurrencePattern] || "за розкладом";
  return interval === 1
    ? `Повтор: ${baseLabel}`
    : `Повтор: інтервал ${interval}, ${baseLabel}`;
}

function addRecurrence(date: Date, event: Event): Date {
  const next = new Date(date);
  const interval = event.recurrenceInterval || 1;

  switch (event.recurrencePattern) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setDate(next.getDate() + interval);
  }

  return next;
}

function eventOverlapsRange(
  eventStart: Date,
  eventEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

function buildRangeLabel(start: Date, end: Date, event: Event): string {
  if (isSameDay(start, end)) {
    const startTime = getTimeLabel(event.eventTime, event.isAllDay);
    const endTime = getTimeLabel(
      event.endTime || event.eventTime,
      event.isAllDay,
    );

    if (event.eventTime && (event.endTime || event.endDate)) {
      return `${formatHumanDate(start)}, ${startTime} - ${endTime}`;
    }

    return `${formatHumanDate(start)}, ${startTime}`;
  }

  return `${formatHumanDate(start)}, ${getTimeLabel(event.eventTime, event.isAllDay)} - ${formatHumanDate(end)}, ${getTimeLabel(event.endTime || event.eventTime, event.isAllDay)}`;
}

function createCalendarEntries(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const participants = normalizeParticipants(event);
  const additionalInfo =
    [event.location, event.courtRoom, event.notes]
      .filter(Boolean)
      .join(" • ") || "Немає додаткової інформації";
  const entries: CalendarEvent[] = [];

  const addOccurrenceEntries = (
    occurrenceStart: Date,
    occurrenceEnd: Date,
    key: string,
  ) => {
    const current = new Date(occurrenceStart);
    current.setHours(0, 0, 0, 0);
    const endBoundary = new Date(occurrenceEnd);
    endBoundary.setHours(0, 0, 0, 0);

    while (current <= endBoundary) {
      if (current >= rangeStart && current <= rangeEnd) {
        const itemDate = new Date(current);
        const hours = event.eventTime?.split(":")[0] || "09";
        const minutes = event.eventTime?.split(":")[1] || "00";
        itemDate.setHours(Number(hours), Number(minutes), 0, 0);

        entries.push({
          id: `${event.id}::${key}::${formatDate(itemDate)}`,
          title: event.title,
          time: getTimeLabel(event.eventTime, event.isAllDay),
          sortTime: event.eventTime ? event.eventTime.slice(0, 5) : "09:00",
          description: event.description || "Опис не вказано",
          participants,
          createdAt: formatCreatedAt(event.createdAt),
          client: event.case?.title || event.case?.caseNumber || "Не вказано",
          deal: event.case?.caseNumber || event.type,
          additionalInfo,
          date: itemDate,
          location: event.location || "Не вказано",
          responsibleContact:
            event.responsibleContact || event.judgeName || "Не вказано",
          recurrenceLabel: getRecurrenceLabel(event),
          rangeLabel: buildRangeLabel(occurrenceStart, occurrenceEnd, event),
        });
      }

      current.setDate(current.getDate() + 1);
    }
  };

  const seedStart = new Date(event.eventDate);
  const seedEnd = event.endDate
    ? new Date(event.endDate)
    : new Date(event.eventDate);

  if (!event.isRecurring || !event.recurrencePattern) {
    if (eventOverlapsRange(seedStart, seedEnd, rangeStart, rangeEnd)) {
      addOccurrenceEntries(seedStart, seedEnd, "single");
    }

    return entries;
  }

  const durationMs = Math.max(seedEnd.getTime() - seedStart.getTime(), 0);
  const recurrenceEnd = event.recurrenceEndDate
    ? new Date(event.recurrenceEndDate)
    : rangeEnd;
  let cursor = new Date(seedStart);

  while (cursor <= rangeEnd && cursor <= recurrenceEnd) {
    const occurrenceEnd = new Date(cursor.getTime() + durationMs);
    if (eventOverlapsRange(cursor, occurrenceEnd, rangeStart, rangeEnd)) {
      addOccurrenceEntries(cursor, occurrenceEnd, cursor.toISOString());
    }
    cursor = addRecurrence(cursor, event);
  }

  return entries;
}

function filterBySearch(
  events: CalendarEvent[],
  query: string,
): CalendarEvent[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return events;
  }

  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(normalized) ||
      event.participants.toLowerCase().includes(normalized) ||
      event.description.toLowerCase().includes(normalized),
  );
}

function groupByDate(
  events: CalendarEvent[],
): Array<{ key: string; date: Date; events: CalendarEvent[] }> {
  const map = new Map<string, { date: Date; events: CalendarEvent[] }>();

  events.forEach((event) => {
    const key = formatDate(event.date);

    if (!map.has(key)) {
      map.set(key, { date: new Date(event.date), events: [] });
    }

    map.get(key)?.events.push(event);
  });

  return Array.from(map.entries())
    .map(([key, value]) => ({ key, date: value.date, events: value.events }))
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

function paginateEvents(
  events: CalendarEvent[],
  page: number,
  pageSize: number,
) {
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: events.slice(startIndex, startIndex + pageSize),
  };
}

function getPaginationRange(page: number, totalPages: number): number[] {
  const maxVisiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  return Array.from(
    { length: Math.max(0, endPage - startPage + 1) },
    (_, index) => startPage + index,
  );
}

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CalendarView>("day");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [globalSearch, setGlobalSearch] = useState("");
  const [daySearch, setDaySearch] = useState("");
  const [weekFilters, setWeekFilters] = useState<PaginatedState>(() =>
    DEFAULT_PAGE_STATE(getStartOfWeek(new Date()), getEndOfWeek(new Date())),
  );
  const [monthFilters, setMonthFilters] = useState<PaginatedState>(() => {
    const range = getMonthRange(new Date());
    return DEFAULT_PAGE_STATE(range.start, range.end);
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRange = useMemo(
    () => toIsoRange(currentView, currentDate),
    [currentDate, currentView],
  );

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await eventService.getCalendarEvents(
          fetchRange.start,
          fetchRange.end,
        );

        if (cancelled) {
          return;
        }

        setEvents(
          result
            .flatMap((event) =>
              createCalendarEntries(event, fetchRange.start, fetchRange.end),
            )
            .sort((left, right) => {
              const dayDiff = left.date.getTime() - right.date.getTime();
              if (dayDiff !== 0) {
                return dayDiff;
              }

              return left.sortTime.localeCompare(right.sortTime);
            }),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError("Не вдалося завантажити календарні події.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [fetchRange.end, fetchRange.start, refreshKey]);

  useEffect(() => {
    const weekStart = getStartOfWeek(currentDate);
    const weekEnd = getEndOfWeek(currentDate);

    setWeekFilters((value) => ({
      ...value,
      start: formatDate(weekStart),
      end: formatDate(weekEnd),
      page: 1,
    }));

    const monthRange = getMonthRange(currentDate);
    setMonthFilters((value) => ({
      ...value,
      start: formatDate(monthRange.start),
      end: formatDate(monthRange.end),
      page: 1,
    }));
  }, [currentDate]);

  useEffect(() => {
    setSelectedEvent(null);
  }, [location.key]);

  const globallyFilteredEvents = useMemo(
    () => filterBySearch(events, globalSearch),
    [events, globalSearch],
  );

  const eventsMap = useMemo(() => {
    return globallyFilteredEvents.reduce<Record<string, CalendarEvent[]>>(
      (accumulator, event) => {
        const key = formatDate(event.date);
        accumulator[key] = accumulator[key] || [];
        accumulator[key].push(event);
        return accumulator;
      },
      {},
    );
  }, [globallyFilteredEvents]);

  const currentDayKey = formatDate(currentDate);
  const dayEvents = useMemo(
    () => filterBySearch(eventsMap[currentDayKey] || [], daySearch),
    [currentDayKey, daySearch, eventsMap],
  );

  const weekListEvents = useMemo(() => {
    const start = weekFilters.start
      ? new Date(`${weekFilters.start}T00:00:00`)
      : getStartOfWeek(currentDate);
    const end = weekFilters.end
      ? new Date(`${weekFilters.end}T23:59:59`)
      : getEndOfWeek(currentDate);

    return filterBySearch(
      globallyFilteredEvents.filter(
        (event) => event.date >= start && event.date <= end,
      ),
      weekFilters.search,
    );
  }, [
    currentDate,
    globallyFilteredEvents,
    weekFilters.end,
    weekFilters.search,
    weekFilters.start,
  ]);

  const monthListEvents = useMemo(() => {
    const range = getMonthRange(currentDate);
    const start = monthFilters.start
      ? new Date(`${monthFilters.start}T00:00:00`)
      : range.start;
    const end = monthFilters.end
      ? new Date(`${monthFilters.end}T23:59:59`)
      : range.end;

    return filterBySearch(
      globallyFilteredEvents.filter(
        (event) => event.date >= start && event.date <= end,
      ),
      monthFilters.search,
    );
  }, [
    currentDate,
    globallyFilteredEvents,
    monthFilters.end,
    monthFilters.search,
    monthFilters.start,
  ]);

  const weekPagination = useMemo(
    () =>
      paginateEvents(weekListEvents, weekFilters.page, weekFilters.pageSize),
    [weekFilters.page, weekFilters.pageSize, weekListEvents],
  );
  const monthPagination = useMemo(
    () =>
      paginateEvents(monthListEvents, monthFilters.page, monthFilters.pageSize),
    [monthFilters.page, monthFilters.pageSize, monthListEvents],
  );

  useEffect(() => {
    if (weekPagination.page !== weekFilters.page) {
      setWeekFilters((value) => ({ ...value, page: weekPagination.page }));
    }
  }, [weekFilters.page, weekPagination.page]);

  useEffect(() => {
    if (monthPagination.page !== monthFilters.page) {
      setMonthFilters((value) => ({ ...value, page: monthPagination.page }));
    }
  }, [monthFilters.page, monthPagination.page]);

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    startDay.setDate(
      startDay.getDate() -
        (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1),
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + index);
      return date;
    });
  }, [currentDate]);

  const yearMonths = useMemo(
    () =>
      Array.from(
        { length: 12 },
        (_, month) => new Date(currentDate.getFullYear(), month, 1),
      ),
    [currentDate],
  );

  const periodLabel = useMemo(() => {
    if (currentView === "day") {
      return formatHumanDate(currentDate);
    }

    if (currentView === "week") {
      const start = getStartOfWeek(currentDate);
      const end = getEndOfWeek(currentDate);
      const startMonth = MONTH_NAMES_GENITIVE[start.getMonth()];
      const endMonth = MONTH_NAMES_GENITIVE[end.getMonth()];

      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${endMonth} ${start.getFullYear()}`;
      }

      return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${start.getFullYear()}`;
    }

    if (currentView === "month") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    return String(currentDate.getFullYear());
  }, [currentDate, currentView]);

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const shiftPeriod = (direction: -1 | 1, view: CalendarView) => {
    if (view === "week") {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 7 * direction);
      setCurrentDate(nextDate);
      return;
    }

    if (view === "month") {
      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + direction);
      setCurrentDate(nextDate);
      return;
    }

    if (view === "year") {
      setCurrentDate(new Date(currentDate.getFullYear() + direction, 0, 1));
    }
  };

  const renderEventCard = (event: CalendarEvent, withDate = false) => (
    <button
      key={`${event.id}-${withDate ? formatDate(event.date) : "day"}`}
      type="button"
      className="event-card"
      onClick={() => setSelectedEvent(event)}
    >
      <div className="event-time">
        {withDate
          ? `${formatHumanDate(event.date)}, ${event.time}`
          : event.time}
      </div>
      <div className="event-title">{event.title}</div>
      <div className="event-participants">Учасники: {event.participants}</div>
      <div className="event-summary">{event.description}</div>
    </button>
  );

  const renderGroupedList = (items: CalendarEvent[]) => {
    const groups = groupByDate(items);

    if (groups.length === 0) {
      return <div className="empty-events">Подій не знайдено</div>;
    }

    return (
      <div className="events-list">
        {groups.map((group) => (
          <div key={group.key} className="date-group">
            <div className="date-group-title">
              {formatHumanDate(group.date)}
            </div>
            {group.events.map((event) => renderEventCard(event, true))}
          </div>
        ))}
      </div>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 16 },
    (_, index) => currentYear - 10 + index,
  );
  const currentWeekPages = getPaginationRange(
    weekPagination.page,
    weekPagination.totalPages,
  );
  const currentMonthPages = getPaginationRange(
    monthPagination.page,
    monthPagination.totalPages,
  );

  return (
    <div className="workspace-page calendar-page">
      <PageHeader
        title="Календар"
        subtitle="Події, дедлайни та зустрічі в одному робочому ритмі"
        actions={
          <div className="calendar-header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/events/add")}
            >
              Додати подію
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Оновити
            </button>
          </div>
        }
      />
      {error && <Alert type="error">{error}</Alert>}

      <div className="calendar-example-shell">
        <div className="calendar-toolbar">
          <div className="calendar-controls-panel">
            <p className="calendar-period-label">{periodLabel}</p>
            <div className="controls">
              <div className="view-switcher">
                {(["day", "week", "month", "year"] as CalendarView[]).map(
                  (view) => (
                    <button
                      key={view}
                      type="button"
                      className={`view-btn ${currentView === view ? "active" : ""}`}
                      onClick={() => handleViewChange(view)}
                    >
                      {view === "day"
                        ? "День"
                        : view === "week"
                          ? "Тиждень"
                          : view === "month"
                            ? "Місяць"
                            : "Рік"}
                    </button>
                  ),
                )}
              </div>
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  placeholder="Пошук подій..."
                />
                <span className="search-icon">Пошук</span>
              </div>
            </div>
          </div>
        </div>

        {currentView === "day" && (
          <div className="calendar-view day-view active">
            <div className="day-header">
              <div className="day-title">{periodLabel}</div>
              <div className="date-selectors">
                <select
                  className="date-select"
                  value={currentDate.getDate()}
                  onChange={(event) =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        Number(event.target.value),
                      ),
                    )
                  }
                >
                  {Array.from(
                    {
                      length: new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        0,
                      ).getDate(),
                    },
                    (_, index) => index + 1,
                  ).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  className="date-select"
                  value={currentDate.getMonth()}
                  onChange={(event) =>
                    setCurrentDate(
                      new Date(
                        currentDate.getFullYear(),
                        Number(event.target.value),
                        currentDate.getDate(),
                      ),
                    )
                  }
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  className="date-select"
                  value={currentDate.getFullYear()}
                  onChange={(event) =>
                    setCurrentDate(
                      new Date(
                        Number(event.target.value),
                        currentDate.getMonth(),
                        currentDate.getDate(),
                      ),
                    )
                  }
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="day-search">
              <input
                type="text"
                className="day-search-input"
                value={daySearch}
                onChange={(event) => setDaySearch(event.target.value)}
                placeholder="Пошук у подіях дня..."
              />
            </div>
            <div className="events-list">
              {dayEvents.length > 0 ? (
                dayEvents.map((event) => renderEventCard(event))
              ) : (
                <div className="no-events">На цей день подій немає</div>
              )}
            </div>
          </div>
        )}

        {currentView === "week" && (
          <div className="calendar-view week-view active">
            <div className="navigation">
              <div className="nav-buttons">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => shiftPeriod(-1, "week")}
                >
                  ‹
                </button>
                <div className="current-period">{periodLabel}</div>
                <div>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => shiftPeriod(1, "week")}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="nav-btn today-btn"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Сьогодні
                  </button>
                </div>
              </div>
            </div>
            <div className="week-header">
              <div>Час</div>
              {weekDays.map((day, index) => (
                <button
                  key={formatDate(day)}
                  type="button"
                  className="week-day-header"
                  onClick={() => {
                    setCurrentDate(day);
                    setCurrentView("day");
                  }}
                >
                  <div className="day-of-week">{WEEKDAY_SHORT[index]}</div>
                  <div
                    className="day-number-large"
                    style={
                      isSameDay(day, new Date())
                        ? { color: "#4285f4" }
                        : undefined
                    }
                  >
                    {day.getDate()}
                  </div>
                </button>
              ))}
            </div>
            <div className="week-grid">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="time-slot">{`${hour}:00`}</div>
                  {weekDays.map((day) => {
                    const dayKey = formatDate(day);
                    const slotEvents = (eventsMap[dayKey] || []).filter(
                      (event) => Number(event.time.split(":")[0]) === hour,
                    );

                    return (
                      <button
                        key={`${dayKey}-${hour}`}
                        type="button"
                        className={`day-slot ${isSameDay(day, new Date()) ? "current-day" : ""}`}
                        onClick={() => {
                          setCurrentDate(day);
                          setCurrentView("day");
                        }}
                      >
                        {slotEvents.map((event) => (
                          <span
                            key={event.id}
                            className="event-week"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            {event.time} {event.title}
                          </span>
                        ))}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="week-events-section">
              <h3>Усі події тижня</h3>

              <div className="week-events-filters">
                <input
                  type="date"
                  className="filter-input"
                  value={weekFilters.start}
                  onChange={(event) =>
                    setWeekFilters((value) => ({
                      ...value,
                      start: event.target.value,
                      page: 1,
                    }))
                  }
                />
                <input
                  type="date"
                  className="filter-input"
                  value={weekFilters.end}
                  onChange={(event) =>
                    setWeekFilters((value) => ({
                      ...value,
                      end: event.target.value,
                      page: 1,
                    }))
                  }
                />
                <input
                  type="text"
                  className="filter-input"
                  value={weekFilters.search}
                  onChange={(event) =>
                    setWeekFilters((value) => ({
                      ...value,
                      search: event.target.value,
                      page: 1,
                    }))
                  }
                  placeholder="Пошук у подіях..."
                />
              </div>

              <div className="events-list-container">
                {renderGroupedList(weekPagination.items)}
              </div>

              <div className="pagination-controls">
                <div className="page-size-selector">
                  <span>Показати:</span>
                  <select
                    className="page-size-select"
                    value={weekFilters.pageSize}
                    onChange={(event) =>
                      setWeekFilters((value) => ({
                        ...value,
                        pageSize: Number(event.target.value),
                        page: 1,
                      }))
                    }
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>записів</span>
                </div>

                <div className="pagination">
                  {weekPagination.totalPages > 1 && (
                    <>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() =>
                          setWeekFilters((value) => ({
                            ...value,
                            page: Math.max(1, value.page - 1),
                          }))
                        }
                      >
                        ‹
                      </button>
                      {currentWeekPages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={`page-btn ${page === weekPagination.page ? "active" : ""}`}
                          onClick={() =>
                            setWeekFilters((value) => ({ ...value, page }))
                          }
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() =>
                          setWeekFilters((value) => ({
                            ...value,
                            page: Math.min(
                              weekPagination.totalPages,
                              value.page + 1,
                            ),
                          }))
                        }
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "month" && (
          <div className="calendar-view month-view active">
            <div className="navigation">
              <div className="nav-buttons">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => shiftPeriod(-1, "month")}
                >
                  ‹
                </button>
                <div className="month-navigation">
                  <select
                    className="month-select"
                    value={currentDate.getMonth()}
                    onChange={(event) =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          Number(event.target.value),
                          1,
                        ),
                      )
                    }
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    className="year-select-month"
                    value={currentDate.getFullYear()}
                    onChange={(event) =>
                      setCurrentDate(
                        new Date(
                          Number(event.target.value),
                          currentDate.getMonth(),
                          1,
                        ),
                      )
                    }
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => shiftPeriod(1, "month")}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="nav-btn today-btn"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Сьогодні
                  </button>
                </div>
              </div>
            </div>

            <div className="calendar-header">
              {WEEKDAY_FULL.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {monthDays.map((day) => {
                const dayKey = formatDate(day);
                const hasEvents = (eventsMap[dayKey] || []).length > 0;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? "other-month" : ""}`}
                    onClick={() => {
                      setCurrentDate(day);
                      setCurrentView("day");
                    }}
                  >
                    <div
                      className={`day-number ${hasEvents ? "has-event" : ""}`}
                      style={
                        isSameDay(day, new Date())
                          ? { color: "#4285f4" }
                          : undefined
                      }
                    >
                      {day.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="week-events-section">
              <h3>Усі події місяця</h3>

              <div className="week-events-filters">
                <input
                  type="date"
                  className="filter-input"
                  value={monthFilters.start}
                  onChange={(event) =>
                    setMonthFilters((value) => ({
                      ...value,
                      start: event.target.value,
                      page: 1,
                    }))
                  }
                />
                <input
                  type="date"
                  className="filter-input"
                  value={monthFilters.end}
                  onChange={(event) =>
                    setMonthFilters((value) => ({
                      ...value,
                      end: event.target.value,
                      page: 1,
                    }))
                  }
                />
                <input
                  type="text"
                  className="filter-input"
                  value={monthFilters.search}
                  onChange={(event) =>
                    setMonthFilters((value) => ({
                      ...value,
                      search: event.target.value,
                      page: 1,
                    }))
                  }
                  placeholder="Пошук у подіях..."
                />
              </div>

              <div className="events-list-container">
                {renderGroupedList(monthPagination.items)}
              </div>

              <div className="pagination-controls">
                <div className="page-size-selector">
                  <span>Показати:</span>
                  <select
                    className="page-size-select"
                    value={monthFilters.pageSize}
                    onChange={(event) =>
                      setMonthFilters((value) => ({
                        ...value,
                        pageSize: Number(event.target.value),
                        page: 1,
                      }))
                    }
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>записів</span>
                </div>

                <div className="pagination">
                  {monthPagination.totalPages > 1 && (
                    <>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() =>
                          setMonthFilters((value) => ({
                            ...value,
                            page: Math.max(1, value.page - 1),
                          }))
                        }
                      >
                        ‹
                      </button>
                      {currentMonthPages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={`page-btn ${page === monthPagination.page ? "active" : ""}`}
                          onClick={() =>
                            setMonthFilters((value) => ({ ...value, page }))
                          }
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() =>
                          setMonthFilters((value) => ({
                            ...value,
                            page: Math.min(
                              monthPagination.totalPages,
                              value.page + 1,
                            ),
                          }))
                        }
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === "year" && (
          <div className="calendar-view year-view active">
            <div className="year-view-container">
              <div className="year-navigation">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => shiftPeriod(-1, "year")}
                >
                  ‹
                </button>
                <div className="year-title">{currentDate.getFullYear()}</div>
                <div>
                  <button
                    type="button"
                    className="nav-btn"
                    onClick={() => shiftPeriod(1, "year")}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="nav-btn today-btn"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Сьогодні
                  </button>
                </div>
              </div>
              <div className="year-grid">
                {yearMonths.map((monthDate) => {
                  const firstDay = new Date(
                    monthDate.getFullYear(),
                    monthDate.getMonth(),
                    1,
                  );
                  const startDay = new Date(firstDay);
                  startDay.setDate(
                    startDay.getDate() -
                      (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1),
                  );
                  const miniDays = Array.from({ length: 42 }, (_, index) => {
                    const date = new Date(startDay);
                    date.setDate(startDay.getDate() + index);
                    return date;
                  });

                  return (
                    <div
                      key={monthDate.toISOString()}
                      className="mini-calendar"
                    >
                      <button
                        type="button"
                        className="mini-month-header"
                        onClick={() => {
                          setCurrentDate(
                            new Date(
                              currentDate.getFullYear(),
                              monthDate.getMonth(),
                              1,
                            ),
                          );
                          setCurrentView("month");
                        }}
                      >
                        {MONTH_NAMES[monthDate.getMonth()]}
                      </button>
                      <div className="mini-weekdays">
                        {WEEKDAY_SHORT.map((day) => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      <div className="mini-days">
                        {miniDays.map((day) => {
                          const hasEvents =
                            (eventsMap[formatDate(day)] || []).length > 0;
                          return (
                            <button
                              key={`${monthDate.getMonth()}-${formatDate(day)}`}
                              type="button"
                              className={`mini-day ${day.getMonth() !== monthDate.getMonth() ? "other-month" : ""} ${isSameDay(day, new Date()) ? "current-day" : ""} ${hasEvents ? "has-event" : ""}`}
                              onClick={() => {
                                setCurrentDate(day);
                                setCurrentView("day");
                              }}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div
          className="modal-overlay active"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {selectedEvent.title || "Деталі події"}
              </div>
              <button
                type="button"
                className="close-modal"
                onClick={() => setSelectedEvent(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-content">
              <div className="event-detail">
                <div className="event-detail-row">
                  <div className="event-detail-label">Дата та час:</div>
                  <div className="event-detail-value">
                    {selectedEvent.rangeLabel}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Створено:</div>
                  <div className="event-detail-value">
                    {selectedEvent.createdAt}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Клієнт:</div>
                  <div className="event-detail-value">
                    {selectedEvent.client}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Угода:</div>
                  <div className="event-detail-value">{selectedEvent.deal}</div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Учасники:</div>
                  <div className="event-detail-value">
                    {selectedEvent.participants}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Місце події:</div>
                  <div className="event-detail-value">
                    {selectedEvent.location}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">
                    Контакти відповідальної особи:
                  </div>
                  <div className="event-detail-value">
                    {selectedEvent.responsibleContact}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Повтор:</div>
                  <div className="event-detail-value">
                    {selectedEvent.recurrenceLabel}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">Опис:</div>
                  <div className="event-detail-value">
                    {selectedEvent.description}
                  </div>
                </div>
                <div className="event-detail-row">
                  <div className="event-detail-label">
                    Додаткова інформація:
                  </div>
                  <div className="event-detail-value">
                    {selectedEvent.additionalInfo}
                  </div>
                </div>
              </div>
              <div className="event-detail-actions">
                <button type="button" className="btn btn-secondary" disabled>
                  Редагувати
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedEvent(null)}
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
