const API_BASE_URL = "http://localhost:8080/admin";

const ADMIN_USERS_CACHE_TTL_MS = 30_000;
let managedUsersCache = null;
let managedUsersCacheTime = 0;
let inFlightManagedUsersPromise = null;

export const clearManagedUsersCache = () => {
  managedUsersCache = null;
  managedUsersCacheTime = 0;
  inFlightManagedUsersPromise = null;
};


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

export const getManagedUsers = async ({ forceRefresh = false } = {}) => {
  const now = Date.now();
  const cacheValid =
    !forceRefresh &&
    managedUsersCache &&
    now - managedUsersCacheTime < ADMIN_USERS_CACHE_TTL_MS;

  if (cacheValid) {
    return managedUsersCache;
  }

  if (inFlightManagedUsersPromise && !forceRefresh) {
    return inFlightManagedUsersPromise;
  }

  inFlightManagedUsersPromise = fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
    .then(parseResponse)
    .then((data) => {
      managedUsersCache = data;
      managedUsersCacheTime = Date.now();
      return data;
    })
    .finally(() => {
      inFlightManagedUsersPromise = null;
    });

  return inFlightManagedUsersPromise;
};

export const createManagedUser = async (payload) => {
  clearManagedUsersCache();
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const deleteManagedUser = async (userId) => {
  clearManagedUsersCache();
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
