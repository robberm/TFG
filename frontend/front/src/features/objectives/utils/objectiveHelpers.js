export const GOAL_STATUS_LABELS = {
  NotStarted: "Sin empezar",
  InProgress: "En progreso",
  Done: "Completado",
};

export const GOAL_STATUS_COLORS = {
  NotStarted: "#6c757d",
  InProgress: "#ffb347",
  Done: "#5ad18a",
};

export const PRIORITY_COLORS = {
  Alta: "#ff5f6d",
  Media: "#ffb347",
  Baja: "#5ad18a",
};

export const EMPTY_GOAL_FORM = {
  titulo: "",
  description: "",
  priority: "Media",
  status: "NotStarted",
  isNumeric: false,
  valorProgreso: "",
  valorObjetivo: "",
  active: true,
  notes: "",
};

export const EMPTY_HABIT_FORM = {
  titulo: "",
  description: "",
  priority: "Media",
  active: true,
};

export const toInputNumberValue = (value) =>
  value === null || value === undefined ? "" : value;

export const normalizeGoalForm = (form) => ({
  titulo: form.titulo.trim(),
  description: form.description.trim(),
  priority: form.priority,
  status: form.status,
  isNumeric: Boolean(form.isNumeric),
  valorProgreso:
    form.isNumeric && form.valorProgreso !== ""
      ? Number(form.valorProgreso)
      : null,
  valorObjetivo:
    form.isNumeric && form.valorObjetivo !== ""
      ? Number(form.valorObjetivo)
      : null,
  active: Boolean(form.active),
});

export const normalizeHabitForm = (form) => ({
  titulo: form.titulo.trim(),
  description: form.description.trim(),
  priority: form.priority,
  active: Boolean(form.active),
});

export const getPriorityColor = (priority) =>
  PRIORITY_COLORS[priority] || "#7c7c7c";

export const calculateGoalProgressPercent = (goal) => {
  if (!goal?.isNumeric) return 0;
  if (!goal?.valorObjetivo || goal.valorObjetivo <= 0) return 0;

  const rawPercent =
    (Number(goal.valorProgreso || 0) * 100) / Number(goal.valorObjetivo);
  return Math.max(0, Math.min(100, rawPercent));
};

export const formatIsoDate = (date) => {
  const target = typeof date === "string" ? new Date(date) : date;
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getStartOfWeek = (date = new Date()) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

export const getEndOfWeek = (startOfWeek) => {
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6);
  end.setHours(0, 0, 0, 0);
  return end;
};

export const getWeekDays = (startOfWeek) => {
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return labels.map((label, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    return {
      label,
      date,
      isoDate: formatIsoDate(date),
    };
  });
};

export const buildHabitCompletionMap = (logs) => {
  return logs.reduce((acc, log) => {
    if (log.completed === null || log.completed === undefined) {
      return acc;
    }

    const objectiveId = log.objective?.id;
    if (!objectiveId) {
      return acc;
    }

    if (!acc[objectiveId]) {
      acc[objectiveId] = {};
    }

    acc[objectiveId][log.logDate] = Boolean(log.completed);
    return acc;
  }, {});
};

export const buildWeeklyHabitStats = (habits, logs, startOfWeek) => {
  const weekDays = getWeekDays(startOfWeek);

  return weekDays.map((day) => {
    const completed = logs.filter(
      (log) => log.logDate === day.isoDate && log.completed === true,
    ).length;

    return {
      ...day,
      completed,
      total: habits.length,
    };
  });
};

export const buildGoalStatusDistribution = (goals) => {
  const counts = goals.reduce(
    (acc, goal) => {
      const status = goal.status || "NotStarted";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      NotStarted: 0,
      InProgress: 0,
      Done: 0,
    },
  );

  const total = goals.length || 1;
  const segments = [
    {
      key: "Done",
      label: GOAL_STATUS_LABELS.Done,
      value: counts.Done,
      percent: counts.Done / total,
      color: GOAL_STATUS_COLORS.Done,
    },
    {
      key: "InProgress",
      label: GOAL_STATUS_LABELS.InProgress,
      value: counts.InProgress,
      percent: counts.InProgress / total,
      color: GOAL_STATUS_COLORS.InProgress,
    },
    {
      key: "NotStarted",
      label: GOAL_STATUS_LABELS.NotStarted,
      value: counts.NotStarted,
      percent: counts.NotStarted / total,
      color: GOAL_STATUS_COLORS.NotStarted,
    },
  ];

  return segments;
};
