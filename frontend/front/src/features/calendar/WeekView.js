import React from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

const HOUR_HEIGHT_PX = 80;
const MINUTES_PER_HOUR = 60;
const PX_PER_MINUTE = HOUR_HEIGHT_PX / MINUTES_PER_HOUR;

const WeekView = ({ currentDate, events, onTimeSlotClick, onEventClick }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentTime = new Date();

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const getEventsForDay = (day) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), day));
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
    return format(event.startTime, "HH:mm");
  };

  return (
    <div className="calendar-week">
      <div className="week-view-header">
        <div className="week-time-gutter"></div>

        <div className="week-view-header-days">
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                className={`week-day-header ${isToday ? "today" : ""}`}
              >
                <div className="week-day-name">
                  {format(day, "EEE", { locale: es })}
                </div>
                <div className="week-day-number">{format(day, "d")}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="week-view-container">
        <div className="week-view-timeline">
          {hours.map((hour) => (
            <div key={hour} className="week-time-slot-row">
              <div className="week-time-label">
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            </div>
          ))}
        </div>

        <div className="week-view-grid">
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day).filter(
              (event) => !event.isAllDay,
            );
            const isToday = isSameDay(day, currentTime);

            return (
              <div key={dayIndex} className="week-day-column">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="week-time-cell"
                    onClick={() => onTimeSlotClick(day, hour)}
                  >
                    <div className="week-time-cell-half"></div>
                  </div>
                ))}

                <div className="week-events-container">
                  {dayEvents.map((event) => {
                    const style = getEventStyle(event);

                    return (
                      <div
                        key={event.id}
                        className={`week-event ${event.category || ""}`}
                        style={style}
                        onClick={(e) => onEventClick(event, e)}
                      >
                        <div className="week-event-time">
                          {formatEventTime(event)}
                        </div>
                        <div className="week-event-title">{event.title}</div>
                      </div>
                    );
                  })}
                </div>

                {isToday && (
                  <div
                    className="week-current-time-indicator"
                    style={{
                      top: `${
                        (currentTime.getHours() * 60 +
                          currentTime.getMinutes()) *
                        PX_PER_MINUTE
                      }px`,
                    }}
                  >
                    <div className="week-current-time-line"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
