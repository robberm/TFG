import { format, parse, parseISO, isValid } from "date-fns";

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

/**
 * Convierte una fecha a texto local compatible con LocalDateTime del backend.
 *
 * @param {Date} date fecha a convertir
 * @returns {string} fecha en formato yyyy-MM-dd'T'HH:mm:ss
 */
const toLocalDateTimeParam = (date) => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

/**
 * Parsea una fecha recibida del backend de forma segura.
 *
 * @param {string|Date} value valor a parsear
 * @returns {Date|null} fecha parseada o null si no es válida
 */
const safeParseDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  try {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  } catch (e) {
    // ignore
  }

  try {
    const withMicros = parse(value, "yyyy-MM-dd HH:mm:ss.SSSSSS", new Date());
    if (isValid(withMicros)) return withMicros;
  } catch (e) {
    // ignore
  }

  try {
    const withoutMicros = parse(value, "yyyy-MM-dd HH:mm:ss", new Date());
    if (isValid(withoutMicros)) return withoutMicros;
  } catch (e) {
    // ignore
  }

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const mapEventDates = (event) => ({
  ...event,
  startTime: safeParseDate(event.startTime),
  endTime: safeParseDate(event.endTime),
});

export const fetchEventsByRange = async (
  startDate,
  endDate,
  targetUserId = null,
  targetAllManaged = false,
) => {
  const start = encodeURIComponent(toLocalDateTimeParam(startDate));
  const end = encodeURIComponent(toLocalDateTimeParam(endDate));
  const targetParam =
    targetUserId != null
      ? `&targetUserId=${encodeURIComponent(targetUserId)}`
      : "";
  const allParam = targetAllManaged ? "&targetAllManaged=true" : "";

  const response = await fetch(
    `${EVENTS_BASE_URL}/range?start=${start}&end=${end}${targetParam}${allParam}`,
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
