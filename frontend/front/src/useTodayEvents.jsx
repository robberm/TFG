import { useCallback, useEffect, useState } from "react";

const useTodayEvents = () => {
  const [events, setEvents] = useState([]);

  const fetchTodayEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing.");
        return;
      }

      const now = new Date();

      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const response = await fetch(
        `http://localhost:8080/events/range?start=${dayStart.toISOString()}&end=${dayEnd.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
        })),
      );
    } catch (error) {
      console.error("Error fetching today events:", error);
    }
  }, []);

  useEffect(() => {
    fetchTodayEvents();
  }, [fetchTodayEvents]);

  return {
    events,
    refreshTodayEvents: fetchTodayEvents,
  };
};

export default useTodayEvents;
