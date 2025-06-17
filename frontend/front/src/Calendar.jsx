import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
/* Date fns lib para agilizar el uso de fechas..*/
import EventModal from './EventModal';
import './css/Calendar.css';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';


const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  useEffect(() => {
    fetchEvents();

    // Setup WebSocket connection for real-time updates
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Connected ws');

        stompClient.subscribe('/topic/calendar', (message) => {
          console.log('📩 Calendar update received:', message.body);
          fetchEvents();
        });
      },
      onStompError: (frame) => {
        console.error(' Error in STOMP', frame);
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

    if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else {
      start = new Date(currentDate.setHours(0, 0, 0, 0));
      end = new Date(currentDate.setHours(23, 59, 59, 999));
    }

    const response = await fetch(
      `http://localhost:8080/events/range?start=${start.toISOString()}&end=${end.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`, // Pasando el token en la cabecera
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    setEvents(data.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    })));
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};


  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowModal(true);
    setSelectedEvent(null); // Clear any selected event when creating a new one
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation(); // Prevent triggering the date click
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
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
    const token = localStorage.getItem("token"); // Obtener el token desde localStorage o donde lo tengas
    if (!token) {
      console.error("Token is missing.");
      return;
    }

    const method = eventData.id ? 'PUT' : 'POST';
    const url = eventData.id
      ? `http://localhost:8080/events/${eventData.id}`
      : 'http://localhost:8080/events';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Aquí pasamos el token también
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    setShowModal(false);
    fetchEvents();
  } catch (error) {
    console.error('Error saving event:', error);
  }
};


  const handleDeleteEvent = async (eventId) => {
  if (!eventId) return;

  try {
    const token = localStorage.getItem("token"); // Obtener el token desde localStorage o donde lo tengas
    if (!token) {
      console.error("Token is missing.");
      return;
    }

    const response = await fetch(`http://localhost:8080/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`, // Pasando el token en la cabecera
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    setShowModal(false);
    fetchEvents();
  } catch (error) {
    console.error('Error deleting event:', error);
  }
};


  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    // Days of week header
    const daysOfWeek = [];
    const daysOfWeekFormat = 'EEE';
    const startOfTheWeek = startOfWeek(new Date());

    for (let i = 0; i < 7; i++) {
      const dayOfWeek = addDays(startOfTheWeek, i);
      daysOfWeek.push(
        <div className="day-header" key={`header-${i}`}>
          {format(dayOfWeek, daysOfWeekFormat)}
        </div>
      );
    }

    // Calendar grid
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = events.filter(event =>
          isSameDay(new Date(event.startTime), cloneDay)
        );

        days.push(
          <div
            className={`day ${!isSameMonth(day, monthStart) ? 'disabled' : ''} ${isSameDay(day, selectedDate) ? 'selected' : ''}`}
            key={day}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span className="day-number">{formattedDate}</span>
            <div className="events-container">
              {dayEvents.map(event => (
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
        <div className="days-header">
          {daysOfWeek}
        </div>
        <div className="days-grid">
          {rows}
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    let dateFormat;
    if (viewMode === 'month') {
      dateFormat = 'MMMM yyyy';
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      dateFormat = 'EEEE, MMMM d, yyyy';
    }

    return (
      <div className="calendar-header">
        <div className="navigation">
          <button onClick={handlePrevious}>Previous</button>
          <button onClick={handleToday}>This month</button>
          <button onClick={handleNext}>Next</button>
        </div>
        <div className="current-date">{format(currentDate, dateFormat)}</div>
        <div className="view-options">
          <button
            className={viewMode === 'day' ? 'active' : ''}
            onClick={() => setViewMode('day')}
          >
            Day
          </button>
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>
      </div>
    );
  };

  // Placeholder for other views - we'll focus on month view for now
  const renderWeekView = () => (
    <div className="calendar-week">
      <p>Week view coming soon</p>
    </div>
  );

  const renderDayView = () => (
    <div className="calendar-day">
      <p>Day view coming soon</p>
    </div>
  );

  return (
    <div className="calendar-container">
      {renderHeader()}

      <div className="calendar-body">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
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