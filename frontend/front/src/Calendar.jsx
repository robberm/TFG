import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import EventModal from "./EventModal";
import "./css/Calendar.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { es } from "date-fns/locale";

const HOUR_HEIGHT_PX = 60;
const MINUTES_PER_HOUR = 60;
const PX_PER_MINUTE = HOUR_HEIGHT_PX / MINUTES_PER_HOUR;

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("month");

  useEffect(() => {
    fetchEvents();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected ws");

        stompClient.subscribe("/topic/calendar", (message) => {
          console.log("📩 Calendar update received:", message.body);
          fetchEvents();
        });
      },
      onStompError: (frame) => {
        console.error("Error in STOMP", frame);
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [currentDate, viewMode]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing.");
        return;
      }

      let start, end;

      if (viewMode === "month") {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (viewMode === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        start = new Date(currentDate.setHours(0, 0, 0, 0));
        end = new Date(currentDate.setHours(23, 59, 59, 999));
      }

      const response = await fetch(
        `http://localhost:8080/events/range?start=${start.toISOString()}&end=${end.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setEvents(
        data.map((event) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
        }))
      );
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowModal(true);
    setSelectedEvent(null);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSaveEvent = async (eventData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing.");
        return;
      }

      const method = eventData.id ? "PUT" : "POST";
      const url = eventData.id
        ? `http://localhost:8080/events/${eventData.id}`
        : "http://localhost:8080/events";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!eventId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing.");
        return;
      }

      const response = await fetch(`http://localhost:8080/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const daysOfWeek = [];
    const daysOfWeekFormat = "EEE";
    const startOfTheWeek = startOfWeek(new Date());

    for (let i = 0; i < 7; i++) {
      const dayOfWeek = addDays(startOfTheWeek, i);
      daysOfWeek.push(
        <div className="day-header" key={`header-${i}`}>
          {format(dayOfWeek, daysOfWeekFormat)}
        </div>
      );
    }

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = events.filter((event) =>
          isSameDay(new Date(event.startTime), cloneDay)
        );

        days.push(
          <div
            className={`day ${
              !isSameMonth(day, monthStart) ? "disabled" : ""
            } ${isSameDay(day, selectedDate) ? "selected" : ""}`}
            key={day}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span className="day-number">{formattedDate}</span>
            <div className="events-container">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`event ${event.category}`}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="week" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="calendar-month">
        <div className="days-header">{daysOfWeek}</div>
        <div className="days-grid">{rows}</div>
      </div>
    );
  };

  const renderHeader = () => {
    let dateText;
    if (viewMode === "month") {
      dateText = format(currentDate, "MMMM yyyy", { locale: es });
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      dateText = `${format(start, "MMM d", { locale: es })} - ${format(
        end,
        "MMM d, yyyy",
        { locale: es }
      )}`;
    } else {
      dateText = format(currentDate, "EEEE, MMMM d, yyyy", { locale: es });
    }

    return (
      <div className="calendar-header">
        <div className="navigation">
          <button onClick={handlePrevious}>Anterior</button>
          <button onClick={handleToday}>Hoy</button>
          <button onClick={handleNext}>Siguiente</button>
        </div>
        <div className="current-date">{dateText}</div>
        <div className="view-options">
          <button
            className={viewMode === "day" ? "active" : ""}
            onClick={() => setViewMode("day")}
          >
            Día
          </button>
          <button
            className={viewMode === "week" ? "active" : ""}
            onClick={() => setViewMode("week")}
          >
            Semana
          </button>
          <button
            className={viewMode === "month" ? "active" : ""}
            onClick={() => setViewMode("month")}
          >
            Mes
          </button>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, );
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentTime = new Date();

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(weekStart, i));
    }

    const getEventsForDay = (day) => {
      return events.filter((event) =>
        isSameDay(new Date(event.startTime), day)
      );
    };

    const handleWeekTimeSlotClick = (day, hour) => {
      const newDate = new Date(day);
      newDate.setHours(hour, 0, 0, 0);
      setSelectedDate(newDate);
      setShowModal(true);
      setSelectedEvent(null);
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
        HOUR_HEIGHT_PX / 2
      );

      return {
        top: `${top}px`,
        height: `${height}px`,
      };
    };

    const formatEventTime = (event) => {
      return format(event.startTime, "HH:mm");
    };

    return (
      <div className="calendar-week">
        <div className="week-view-header">
          <div className="week-time-gutter"></div>
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
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, currentTime);

              return (
                <div key={dayIndex} className="week-day-column">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="week-time-cell"
                      onClick={() => handleWeekTimeSlotClick(day, hour)}
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
                          className={`week-event ${event.category}`}
                          style={style}
                          onClick={(e) => handleEventClick(event, e)}
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

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentTime = new Date();
    const isToday = isSameDay(currentDate, currentTime);

    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.startTime), currentDate)
    );

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
        HOUR_HEIGHT_PX / 2
      );

      return {
        top: `${top}px`,
        height: `${height}px`,
      };
    };

    const formatEventTime = (event) => {
      const startTime = format(event.startTime, "HH:mm");
      const endTime = format(event.endTime, "HH:mm");
      return `${startTime} - ${endTime}`;
    };

    const getCurrentTimePosition = () => {
      const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      return `${minutes * PX_PER_MINUTE}px`;
    };

    const handleTimeSlotClick = (hour) => {
      const newDate = new Date(currentDate);
      newDate.setHours(hour, 0, 0, 0);
      setSelectedDate(newDate);
      setShowModal(true);
      setSelectedEvent(null);
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
            {dayEvents.map((event) => {
              const style = getEventStyle(event);
              return (
                <div
                  key={event.id}
                  className={`day-event ${event.category}`}
                  style={style}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  <div className="day-event-time">{formatEventTime(event)}</div>
                  <div className="day-event-title">{event.title}</div>
                  {event.location && (
                    <div className="day-event-location">
                      📍 {event.location}
                    </div>
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

  return (
    <div className="calendar-container">
      {renderHeader()}

      <div className="calendar-body">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

      {showModal && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default Calendar;
