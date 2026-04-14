const API_BASE_URL = "http://localhost:8080/admin";

const getAuthHeaders = (includeJson = false) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No hay sesión activa.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const parseResponse = async (response) => {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || "Error inesperado en la operación de administrador.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const getManagedUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const createManagedUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const deleteManagedUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const createAdminOrganization = async (organizationName) => {
  const response = await fetch(`${API_BASE_URL}/organization`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ organizationName }),
  });

  return parseResponse(response);
};

export const getManagedUserGoals = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/goals`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const createManagedUserGoal = async (userId, payload) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/goals`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const updateManagedUserGoal = async (userId, goalId, payload) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/goals/${goalId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const deleteManagedUserGoal = async (userId, goalId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/goals/${goalId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const getManagedUserEventsByRange = async (userId, start, end) => {
  const params = new URLSearchParams({
    start,
    end,
  });

  const response = await fetch(`${API_BASE_URL}/users/${userId}/events?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};

export const createManagedUserEvent = async (userId, eventData) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/events`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(eventData),
  });

  return parseResponse(response);
};

export const updateManagedUserEvent = async (userId, eventId, eventData) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/events/${eventId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(eventData),
  });

  return parseResponse(response);
};

export const deleteManagedUserEvent = async (userId, eventId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/events/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseResponse(response);
};
