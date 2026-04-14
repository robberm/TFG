import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import EventModal from "./EventModal";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DailyCalendarView from "./DailyCalendarView";
import useCalendarEvents from "../../hooks/useCalendarEvents";
import { getManagedUsers } from "../../api/adminApi";
import { getCurrentUserProfile } from "../../api/userApi";
import "../../css/Calendar.css";

const Calendar = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedManagedUserId, setSelectedManagedUserId] = useState("");

  useEffect(() => {
    const loadAdminContext = async () => {
      try {
        const profile = await getCurrentUserProfile();
        const adminMode = profile?.role === "ADMIN";
        setIsAdmin(adminMode);

        if (!adminMode) {
          return;
        }

        const users = await getManagedUsers();
        const normalized = Array.isArray(users) ? users : [];
        setManagedUsers(normalized);

        if (normalized.length > 0) {
          setSelectedManagedUserId(String(normalized[0].id));
        }
      } catch (_) {
        setIsAdmin(false);
      }
    };

    loadAdminContext();
  }, []);

  const {
    currentDate,
    selectedDate,
    events,
    showModal,
    selectedEvent,
    viewMode,
    setViewMode,
    fetchEvents,
    handleDateClick,
    handleEventClick,
    handlePrevious,
    handleNext,
    handleToday,
    handleSaveEvent,
    handleDeleteEvent,
    handleDayTimeSlotClick,
    handleWeekTimeSlotClick,
    handleCloseModal,
    getHeaderDateText,
  } = useCalendarEvents({
    isAdmin,
    selectedManagedUserId,
  });

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");

    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/calendar", () => {
          fetchEvents();
        });
      },
      onStompError: () => {},
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [fetchEvents]);

  return (
    <div className="calendar-container">
      {isAdmin && (
        <div className="adminUserSelector adminCalendarSelector">
          <label htmlFor="calendar-managed-user">Usuario subordinado</label>
          <select
            id="calendar-managed-user"
            value={selectedManagedUserId}
            onChange={(event) => setSelectedManagedUserId(event.target.value)}
          >
            {managedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      )}

      <CalendarHeader
        dateText={getHeaderDateText()}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onToday={handleToday}
        onNext={handleNext}
        onChangeView={setViewMode}
      />

      <div className="calendar-body">
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleWeekTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === "day" && (
          <DailyCalendarView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleDayTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {showModal && (
        <EventModal
          event={selectedEvent}
          selectedDate={selectedDate}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          isAdmin={isAdmin}
          managedUsers={managedUsers}
          selectedUserId={selectedManagedUserId}
          onTargetUserChange={setSelectedManagedUserId}
        />
      )}
    </div>
  );
};

export default Calendar;
