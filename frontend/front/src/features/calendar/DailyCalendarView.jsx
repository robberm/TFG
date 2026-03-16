import React from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

const HOUR_HEIGHT_PX = 80;
const MINUTES_PER_HOUR = 60;
const PX_PER_MINUTE = HOUR_HEIGHT_PX / MINUTES_PER_HOUR;

const DailyCalendarView = ({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentTime = new Date();
  const isToday = isSameDay(currentDate, currentTime);

  const allDayEvents = events.filter(
    (event) => event.isAllDay && isSameDay(new Date(event.startTime), currentDate),
  );

  const timedEvents = events.filter(
    (event) => !event.isAllDay && isSameDay(new Date(event.startTime), currentDate),
  );

  const getCurrentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return `${minutes * PX_PER_MINUTE}px`;
  };

  const getEventStyle = (event) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    const top = startMinutes * PX_PER_MINUTE;
    const height = Math.max(
      (endMinutes - startMinutes) * PX_PER_MINUTE,
      HOUR_HEIGHT_PX / 4,
    );

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return "Todo el día";
    return `${format(event.startTime, "HH:mm")} - ${format(event.endTime, "HH:mm")}`;
  };

  const handleTimeSlotClick = (hour) => {
    onTimeSlotClick(hour);
  };

  return (
    <div className="calendar-day">
      <div className="day-view-header">
        <div className="day-view-date">
          {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", {
            locale: es,
          })}
        </div>
      </div>

      {allDayEvents.length > 0 && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            border: "1px solid var(--table-border-color, #e5e7eb)",
            borderRadius: "12px",
            background: "var(--card-bg, rgba(255,255,255,0.7))",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "8px",
              opacity: 0.8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Todo el día
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={`day-event ${event.category || ""}`}
                style={{
                  position: "relative",
                  top: "auto",
                  height: "auto",
                  inset: "auto",
                  cursor: "pointer",
                }}
                onClick={(e) => onEventClick(event, e)}
              >
                <div className="day-event-time">{formatEventTime(event)}</div>
                <div className="day-event-title">{event.title}</div>
                {event.location && (
                  <div className="day-event-location">📍 {event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="day-view-container">
        <div className="day-view-timeline">
          {hours.map((hour) => (
            <div key={hour} className="time-slot-row">
              <div className="time-label">
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
              <div
                className="time-slot"
                onClick={() => handleTimeSlotClick(hour)}
              >
                <div className="time-slot-half"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="day-view-events">
          {timedEvents.map((event) => {
            const style = getEventStyle(event);

            return (
              <div
                key={event.id}
                className={`day-event ${event.category || ""}`}
                style={style}
                onClick={(e) => onEventClick(event, e)}
              >
                <div className="day-event-time">{formatEventTime(event)}</div>
                <div className="day-event-title">{event.title}</div>
                {event.location && (
                  <div className="day-event-location">📍 {event.location}</div>
                )}
              </div>
            );
          })}
        </div>

        {isToday && (
          <div
            className="current-time-indicator"
            style={{ top: getCurrentTimePosition() }}
          >
            <div className="current-time-dot"></div>
            <div className="current-time-line"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyCalendarView;