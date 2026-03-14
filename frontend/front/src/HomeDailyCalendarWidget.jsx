import React, { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import EventModal from "./EventModal";
import "./css/Home.css";
import "./css/Calendar.css";

const HOUR_HEIGHT_PX = 28;
const MINUTES_PER_HOUR = 60;
const PX_PER_MINUTE = HOUR_HEIGHT_PX / MINUTES_PER_HOUR;

const HomeDailyCalendarWidget = ({ events, onEventsChanged }) => {
  const [currentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const allDayEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.isAllDay && isSameDay(new Date(event.startTime), currentDate),
    );
  }, [events, currentDate]);

  const timedEvents = useMemo(() => {
    return events.filter(
      (event) =>
        !event.isAllDay && isSameDay(new Date(event.startTime), currentDate),
    );
  }, [events, currentDate]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

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
      HOUR_HEIGHT_PX * 0.9,
    );

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return `${minutes * PX_PER_MINUTE}px`;
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return "Todo el día";
    return `${format(event.startTime, "HH:mm")} - ${format(
      event.endTime,
      "HH:mm",
    )}`;
  };

  const handleTimeSlotClick = (hour) => {
    const newDate = new Date(currentDate);
    newDate.setHours(hour, 0, 0, 0);
    setSelectedDate(newDate);
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event, e) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedEvent(event);
    setShowModal(true);
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
      onEventsChanged();
    } catch (error) {
      console.error("Error saving event from home widget:", error);
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
      onEventsChanged();
    } catch (error) {
      console.error("Error deleting event from home widget:", error);
    }
  };

  return (
    <>
      <div className="homeDailyWidget">
        <div className="homeDailyWidgetInner">
          <div className="homeDailyWidgetCollapsedContent">
            <div className="homeDailyPreviewShell">
              <div className="homeDailyPreviewCircle"></div>
            </div>

            <div className="homeDailyPreviewMeta">
              <div className="homeDailyPreviewTitle">Calendar</div>
              <div className="homeDailyPreviewSubtitle">
                {events.length} evento{events.length !== 1 ? "s" : ""} hoy
              </div>
            </div>
          </div>

          <div className="homeDailyWidgetExpandedContent">
            <div className="homeDailyExpandedHeader">
              <div>
                <div className="homeDailyWidgetEyebrow">Daily View</div>
                <div className="homeDailyWidgetDate">
                  {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
                </div>
              </div>
            </div>

            {allDayEvents.length > 0 && (
              <div className="homeDailyAllDayBlock">
                <div className="homeDailyAllDayLabel">Todo el día</div>

                <div className="homeDailyAllDayList">
                  {allDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`day-event ${event.category || ""} homeAllDayEvent`}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="day-event-time">
                        {formatEventTime(event)}
                      </div>
                      <div className="day-event-title">{event.title}</div>
                      {event.location && (
                        <div className="day-event-location">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="homeDailyTimeline">
              <div className="homeDailyTimelineLabels">
                {hours.map((hour) => (
                  <div key={hour} className="homeDailyTimelineLabel">
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>

              <div className="homeDailyTimelineGrid">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="homeDailyTimelineRow"
                    onClick={() => handleTimeSlotClick(hour)}
                  />
                ))}

                <div className="homeDailyEventsLayer">
                  {timedEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`day-event ${event.category || ""} homeDailyEventCard`}
                      style={getEventStyle(event)}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="day-event-time">
                        {formatEventTime(event)}
                      </div>
                      <div className="day-event-title">{event.title}</div>
                      {event.location && (
                        <div className="day-event-location">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isSameDay(currentDate, new Date()) && (
                  <div
                    className="homeDailyNowIndicator"
                    style={{ top: getCurrentTimePosition() }}
                  >
                    <div className="homeDailyNowDot"></div>
                    <div className="homeDailyNowLine"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
    </>
  );
};

export default HomeDailyCalendarWidget;
