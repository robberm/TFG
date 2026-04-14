const API_BASE_URL = "http://localhost:8080";

const getToken = () => localStorage.getItem("token");

const buildHeaders = (extraHeaders = {}) => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

const parseResponse = async (response) => {
  if (!response.ok) {
    let message = "Ha ocurrido un error inesperado.";

    try {
      const errorBody = await response.text();
      if (errorBody) {
        message = errorBody;
      }
    } catch (_) {
      // No hacemos nada, dejamos el mensaje genérico.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  return parseResponse(response);
};

/* Goals */
export const getGoals = (targetUserId = null) =>
  request(
    targetUserId ? `/goals?targetUserId=${encodeURIComponent(targetUserId)}` : "/goals",
  );

export const getGoalById = (goalId) => request(`/goals/${goalId}`);

export const createGoal = (payload) =>
  request("/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateGoal = (goalId, payload) =>
  request(`/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const updateGoalProgress = (goalId, payload) =>
  request(`/goals/${goalId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteGoal = (goalId) =>
  request(`/goals/${goalId}`, {
    method: "DELETE",
  });

/* Habits */
export const getHabits = () => request("/habits");

export const getActiveHabits = () => request("/habits/active");

export const getHabitById = (habitId) => request(`/habits/${habitId}`);

export const createHabit = (payload) =>
  request("/habits", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateHabit = (habitId, payload) =>
  request(`/habits/${habitId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const markHabitCompletion = (habitId, payload) =>
  request(`/habits/${habitId}/completion`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteHabit = (habitId) =>
  request(`/habits/${habitId}`, {
    method: "DELETE",
  });

/* Logs */
export const getObjectiveLogsByRange = (startDate, endDate) =>
  request(`/objective-logs/range?startDate=${startDate}&endDate=${endDate}`);

export const getObjectiveLogsByObjectiveId = (objectiveId) =>
  request(`/objective-logs/objective/${objectiveId}`);
