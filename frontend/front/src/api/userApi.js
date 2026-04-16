const API_BASE_URL = "http://localhost:8080";
const PROFILE_CACHE_TTL_MS = 30_000;

let profileCache = null;
let profileCacheToken = null;
let profileCacheTime = 0;
let inFlightProfilePromise = null;

const fetchCurrentUserProfile = async (token) => {
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

  return data;
};

export const clearCurrentUserProfileCache = () => {
  profileCache = null;
  profileCacheToken = null;
  profileCacheTime = 0;
  inFlightProfilePromise = null;
};

export const getCurrentUserProfile = async ({ forceRefresh = false } = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    clearCurrentUserProfileCache();
    throw new Error("No hay sesión activa.");
  }

  const now = Date.now();
  const isCacheValid =
    !forceRefresh &&
    profileCache &&
    profileCacheToken === token &&
    now - profileCacheTime < PROFILE_CACHE_TTL_MS;

  if (isCacheValid) {
    return profileCache;
  }

  if (inFlightProfilePromise && profileCacheToken === token && !forceRefresh) {
    return inFlightProfilePromise;
  }

  profileCacheToken = token;
  inFlightProfilePromise = fetchCurrentUserProfile(token)
    .then((data) => {
      profileCache = data;
      profileCacheTime = Date.now();
      return data;
    })
    .finally(() => {
      inFlightProfilePromise = null;
    });

  return inFlightProfilePromise;
};
