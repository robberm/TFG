const API_BASE_URL = "http://localhost:8080";

let cachedProfile = null;
let cachedProfileToken = null;

export const clearCurrentUserProfileCache = () => {
  cachedProfile = null;
  cachedProfileToken = null;
};

export const getCurrentUserProfile = async ({ forceRefresh = false } = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    clearCurrentUserProfileCache();
    throw new Error("No hay sesión activa.");
  }

  if (!forceRefresh && cachedProfile && cachedProfileToken === token) {
    return cachedProfile;
  }

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo cargar el perfil de usuario.");
  }

  cachedProfile = data;
  cachedProfileToken = token;
  return data;
};
