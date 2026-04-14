import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  fetchEventsByRange,
  saveCalendarEvent,
  deleteCalendarEvent,
} from "../api/eventApi";
import {
  createManagedUserEvent,
  deleteManagedUserEvent,
  getManagedUserEventsByRange,
  updateManagedUserEvent,
} from "../api/adminApi";

const toLocalDateTimeParam = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");

const useCalendarEvents = ({
  isAdmin = false,
  selectedManagedUserId = "",
} = {}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState("month");

  const fetchEvents = useCallback(async () => {
    try {
      let start;
      let end;

      if (viewMode === "month") {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (viewMode === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        start = dayStart;
        end = dayEnd;
      }

      if (isAdmin) {
        if (!selectedManagedUserId) {
          setEvents([]);
          return;
        }

        const data = await getManagedUserEventsByRange(
          selectedManagedUserId,
          toLocalDateTimeParam(start),
          toLocalDateTimeParam(end),
        );
        setEvents(Array.isArray(data) ? data : []);
        return;
      }

      const data = await fetchEventsByRange(start, end);
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [currentDate, isAdmin, selectedManagedUserId, viewMode]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDateClick = useCallback((day) => {
    setSelectedDate(day);
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  const handleEventClick = useCallback((event, e) => {
    if (e) {
      e.stopPropagation();
    }

    setSelectedEvent(event);
    setShowModal(true);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentDate((prevDate) => {
      if (viewMode === "month") {
        return subMonths(prevDate, 1);
      }
      if (viewMode === "week") {
        return addDays(prevDate, -7);
      }
      return addDays(prevDate, -1);
    });
  }, [viewMode]);

  const handleNext = useCallback(() => {
    setCurrentDate((prevDate) => {
      if (viewMode === "month") {
        return addMonths(prevDate, 1);
      }
      if (viewMode === "week") {
        return addDays(prevDate, 7);
      }
      return addDays(prevDate, 1);
    });
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleSaveEvent = useCallback(
    async (eventData) => {
      try {
        if (isAdmin) {
          if (!selectedManagedUserId) {
            throw new Error("Debes seleccionar un usuario subordinado.");
          }

          if (eventData.id) {
            await updateManagedUserEvent(
              selectedManagedUserId,
              eventData.id,
              eventData,
            );
          } else {
            await createManagedUserEvent(selectedManagedUserId, eventData);
          }
        } else {
          await saveCalendarEvent(eventData);
        }

        setShowModal(false);
        await fetchEvents();
      } catch (error) {
        console.error("Error saving event:", error);
      }
    },
    [fetchEvents, isAdmin, selectedManagedUserId],
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      if (!eventId) return;

      try {
        if (isAdmin) {
          if (!selectedManagedUserId) {
            throw new Error("Debes seleccionar un usuario subordinado.");
          }

          await deleteManagedUserEvent(selectedManagedUserId, eventId);
        } else {
          await deleteCalendarEvent(eventId);
        }

        setShowModal(false);
        await fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    },
    [fetchEvents, isAdmin, selectedManagedUserId],
  );

  const handleDayTimeSlotClick = useCallback(
    (hour) => {
      const newDate = new Date(currentDate);
      newDate.setHours(hour, 0, 0, 0);
      setSelectedDate(newDate);
      setSelectedEvent(null);
      setShowModal(true);
    },
    [currentDate],
  );

  const handleWeekTimeSlotClick = useCallback((day, hour) => {
    const newDate = new Date(day);
    newDate.setHours(hour, 0, 0, 0);
    setSelectedDate(newDate);
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const getHeaderDateText = useCallback(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: es });
    }

    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });

      return `${format(start, "MMM d", { locale: es })} - ${format(
        end,
        "MMM d, yyyy",
        {
          locale: es,
        },
      )}`;
    }

    return format(currentDate, "EEEE, MMMM d, yyyy", { locale: es });
  }, [currentDate, viewMode]);

  return {
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
  };
};

export default useCalendarEvents;
