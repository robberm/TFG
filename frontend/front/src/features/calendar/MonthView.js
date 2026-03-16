import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";

const MonthView = ({
  currentDate,
  selectedDate,
  events,
  onDateClick,
  onEventClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  const daysOfWeek = [];
  const dateFormat = "d";
  const daysOfWeekFormat = "EEE";
  const startOfTheWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

  for (let i = 0; i < 7; i++) {
    const dayOfWeek = addDays(startOfTheWeek, i);

    daysOfWeek.push(
      <div className="day-header" key={`header-${i}`}>
        {format(dayOfWeek, daysOfWeekFormat)}
      </div>,
    );
  }

  let day = startDate;

  while (day <= endDate) {
    const formattedDate = format(day, dateFormat);
    const cloneDay = day;

    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.startTime), cloneDay),
    );

    days.push(
      <div
        className={`day ${!isSameMonth(day, monthStart) ? "disabled" : ""} ${
          isSameDay(day, selectedDate) ? "selected" : ""
        }`}
        key={day.toISOString()}
        onClick={() => onDateClick(cloneDay)}
      >
        <span className="day-number">{formattedDate}</span>

        <div className="events-container">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className={`event ${event.category || ""}`}
              onClick={(e) => onEventClick(event, e)}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>,
    );

    day = addDays(day, 1);
  }

  return (
    <div className="calendar-month">
      <div className="days-header">{daysOfWeek}</div>
      <div className="days-grid">{days}</div>
    </div>
  );
};

export default MonthView;
