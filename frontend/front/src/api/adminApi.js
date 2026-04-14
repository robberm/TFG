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
