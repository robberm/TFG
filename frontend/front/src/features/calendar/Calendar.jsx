import React, { useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import EventModal from "./EventModal";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DailyCalendarView from "./DailyCalendarView";
import useCalendarEvents from "../../hooks/useCalendarEvents";
import "../../css/Calendar.css";

const Calendar = () => {
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
  } = useCalendarEvents();

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
        />
      )}
    </div>
  );
};

export default Calendar;
