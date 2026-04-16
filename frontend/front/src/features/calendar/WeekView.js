import React, { useEffect, useRef, useState } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

const HOUR_HEIGHT_PX = 80;
const MINUTES_PER_HOUR = 60;
const PX_PER_MINUTE = HOUR_HEIGHT_PX / MINUTES_PER_HOUR;

/**
 * Convierte una fecha del backend a objeto Date de forma estable.
 * Soporta correctamente LocalDateTime sin zona horaria y fechas ISO con zona.
 *
 * @param {string|Date} value fecha recibida del backend
 * @returns {Date} fecha parseada
 */
const parseCalendarDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value !== "string") {
    return new Date(value);
  }

  const localDateTimeRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,9}))?$/;

  const match = value.match(localDateTimeRegex);

  if (match) {
    const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
      match;

    const milliseconds = Number(fraction.slice(0, 3).padEnd(3, "0"));

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds,
    );
  }

  return parseISO(value);
};

/**
 * Devuelve los minutos transcurridos desde las 00:00 para una fecha dada.
 *
 * @param {Date} date fecha a evaluar
 * @returns {number} minutos del día
 */
const getMinutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

/**
 * Calcula el estilo visual de un evento dentro de la vista semanal.
 *
 * @param {Object} event evento a pintar
 * @returns {{top: string, height: string}} estilo css
 */
const getTimedEventStyle = (event) => {
  const start = parseCalendarDate(event.startTime);
  const end = parseCalendarDate(event.endTime);

  const startMinutes = getMinutesOfDay(start);
  let endMinutes = getMinutesOfDay(end);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

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

const WeekView = ({ currentDate, events, onTimeSlotClick, onEventClick }) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentTime = new Date();

  const gridViewportRef = useRef(null);
  const timelineRef = useRef(null);
  const [headerScrollLeft, setHeaderScrollLeft] = useState(0);
  const [headerPaddingRight, setHeaderPaddingRight] = useState(0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const shortDayNames = ["L", "M", "X", "J", "V", "S", "D"];

  const getEventsForDay = (day) => {
    return events.filter((event) =>
      isSameDay(parseCalendarDate(event.startTime), day),
    );
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return "Todo el día";
    return format(parseCalendarDate(event.startTime), "HH:mm");
  };

  useEffect(() => {
    const updateScrollbarCompensation = () => {
      if (!gridViewportRef.current) return;

      const scrollbarWidth =
        gridViewportRef.current.offsetWidth -
        gridViewportRef.current.clientWidth;

      setHeaderPaddingRight(Math.max(scrollbarWidth, 0));
    };

    updateScrollbarCompensation();
    window.addEventListener("resize", updateScrollbarCompensation);

    return () => {
      window.removeEventListener("resize", updateScrollbarCompensation);
    };
  }, []);

  const handleGridScroll = (e) => {
    const { scrollLeft, scrollTop } = e.currentTarget;

    setHeaderScrollLeft(scrollLeft);

    if (timelineRef.current) {
      timelineRef.current.scrollTop = scrollTop;
    }
  };

  return (
    <div className="calendar-week">
      <div className="week-view-header">
        <div className="week-time-gutter"></div>

        <div className="week-header-days-viewport">
          <div
            className="week-view-header-days"
            style={{
              transform: `translateX(-${headerScrollLeft}px)`,
              paddingRight: `${headerPaddingRight}px`,
            }}
          >
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`week-day-header ${isToday ? "today" : ""}`}
                >
                  <div className="week-day-name">
                    {shortDayNames[index]}
                  </div>
                  <div className="week-day-number">{format(day, "d")}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="week-view-container">
        <div className="week-view-timeline" ref={timelineRef}>
          {hours.map((hour) => (
            <div key={hour} className="week-time-slot-row">
              <div className="week-time-label">
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            </div>
          ))}
        </div>

        <div
          className="week-grid-viewport"
          ref={gridViewportRef}
          onScroll={handleGridScroll}
        >
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
                      const style = getTimedEventStyle(event);

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
                          {event.assignedByAdmin && (
                            <div className="week-event-assigned">Asignado</div>
                          )}
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
    </div>
  );
};

export default WeekView;
