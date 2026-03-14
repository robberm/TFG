import React, { useMemo } from "react";
import { format } from "date-fns";
import "./css/Home.css";

const TodayReminders = ({ events }) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.startTime - b.startTime);
  }, [events]);

  return (
    <div className="remindersSection">
      <h2>Reminders</h2>

      {sortedEvents.length === 0 ? (
        <div className="remindersEmptyState">No tienes eventos para hoy.</div>
      ) : (
        <div className="remindersList">
          {sortedEvents.map((event) => (
            <div key={event.id} className="reminderCard">
              <div className="reminderCardTime">
                {event.isAllDay
                  ? "Todo el día"
                  : `${format(event.startTime, "HH:mm")} - ${format(
                      event.endTime,
                      "HH:mm",
                    )}`}
              </div>

              <div className="reminderCardTitle">{event.title}</div>

              {event.location && (
                <div className="reminderCardLocation">📍 {event.location}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayReminders;
