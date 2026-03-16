const EVENTS_BASE_URL = "http://localhost:8080/events";

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token is missing.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const mapEventDates = (event) => ({
  ...event,
  startTime: new Date(event.startTime),
  endTime: new Date(event.endTime),
});

export const fetchEventsByRange = async (startDate, endDate) => {
  const response = await fetch(
    `${EVENTS_BASE_URL}/range?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.map(mapEventDates);
};

export const saveCalendarEvent = async (eventData) => {
  const isEditing = Boolean(eventData.id);

  const response = await fetch(
    isEditing ? `${EVENTS_BASE_URL}/${eventData.id}` : EVENTS_BASE_URL,
    {
      method: isEditing ? "PUT" : "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(eventData),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response;
};

export const deleteCalendarEvent = async (eventId) => {
  const response = await fetch(`${EVENTS_BASE_URL}/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response;
};
