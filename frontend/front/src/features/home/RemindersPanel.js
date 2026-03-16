import React from "react";
import { format } from "date-fns";
import "../../css/Home.css";

const RemindersPanel = ({ todayEvents, isLoadingTodayEvents }) => {
  return (
    <div className="remindersSection">
      <h2>Reminders</h2>

      {isLoadingTodayEvents ? (
        <div className="remindersEmptyState">Cargando eventos...</div>
      ) : todayEvents.length === 0 ? (
        <div className="remindersEmptyState">No tienes eventos para hoy.</div>
      ) : (
        <div className="remindersList">
          {todayEvents.map((event) => (
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

export default RemindersPanel;
