import React, { useMemo } from "react";
import {
  buildWeeklyHabitStats,
  calculateGlobalGoalsProgress,
  formatIsoDate,
  getStartOfWeek,
} from "../utils/objectiveHelpers";

const ObjectivesDashboard = ({ goals, habits, logs }) => {
  const todayIso = formatIsoDate(new Date());

  /**
   * Calcula todas las métricas que usamos en el dashboard.
   * Se memoizan para no recalcularlas en cada render si los datos no cambian.
   */
  const metrics = useMemo(() => {
    const startOfWeek = getStartOfWeek(new Date());
    const weeklyStats = buildWeeklyHabitStats(habits, logs, startOfWeek);

    const completedToday = logs.filter(
      (log) => log.logDate === todayIso && log.completed === true,
    ).length;

    const totalCompletedWeek = weeklyStats.reduce(
      (acc, day) => acc + day.completed,
      0,
    );

    const totalPossibleWeek = weeklyStats.reduce(
      (acc, day) => acc + day.total,
      0,
    );

    const weeklyRate =
      totalPossibleWeek > 0
        ? Math.round((totalCompletedWeek * 100) / totalPossibleWeek)
        : 0;

    const bestHabitStreak =
      habits.length > 0
        ? Math.max(...habits.map((habit) => Number(habit.bestStreak || 0)))
        : 0;

    const activeGoals = goals.filter(
      (goal) => goal.active !== false && goal.status !== "Done",
    ).length;

    const completedGoals = goals.filter(
      (goal) => goal.status === "Done",
    ).length;

    const goalsInProgress = goals.filter(
      (goal) => goal.status === "InProgress",
    ).length;

    const totalGoals = goals.length;

    const globalGoalsProgress = calculateGlobalGoalsProgress(goals);

    const todayPercent =
      habits.length > 0
        ? Math.round((completedToday / habits.length) * 100)
        : 0;

    return {
      completedToday,
      weeklyRate,
      bestHabitStreak,
      weeklyStats,
      activeGoals,
      completedGoals,
      goalsInProgress,
      totalGoals,
      globalGoalsProgress,
      todayPercent,
    };
  }, [goals, habits, logs, todayIso]);

  /**
   * Renderiza el anillo de progreso reutilizable para las cards superiores.
   */
  const renderRing = (percent, color1, color2) => {
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="summaryRing">
        <svg viewBox="0 0 60 60">
          <circle className="ringBg" cx="30" cy="30" r={radius} />
          <circle
            className="ringProgress"
            cx="30"
            cy="30"
            r={radius}
            stroke={`url(#gradient-${color1})`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient
              id={`gradient-${color1}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
        </svg>
        <span className="ringPercent">{percent}%</span>
      </div>
    );
  };

  return (
    <section className="objectivesDashboard">
      <div className="summaryCardsGrid">
        <article className="summaryCard">
          <div className="summaryCardContent">
            <div className="summaryTextBlock">
              <span className="summaryLabel">Avance goals</span>
              <strong className="summaryValue">
                {metrics.globalGoalsProgress}%
              </strong>
            </div>
            {renderRing(metrics.globalGoalsProgress, "#667eea", "#764ba2")}
          </div>
        </article>

        <article className="summaryCard">
          <div className="summaryCardContent">
            <div className="summaryTextBlock">
              <span className="summaryLabel">Completados hoy</span>
              <strong className="summaryValue">
                {metrics.completedToday}/{habits.length}
              </strong>
            </div>
            {renderRing(metrics.todayPercent, "#4facfe", "#00f2fe")}
          </div>
        </article>

        <article className="summaryCard">
          <div className="summaryCardContent">
            <div className="summaryTextBlock">
              <span className="summaryLabel">Cumplimiento semanal</span>
              <strong className="summaryValue">{metrics.weeklyRate}%</strong>
            </div>
            {renderRing(metrics.weeklyRate, "#43e97b", "#38f9d7")}
          </div>
        </article>

        <article className="summaryCard">
          <div className="summaryCardContent">
            <div className="summaryTextBlock">
              <span className="summaryLabel">Mejor racha</span>
              <strong className="summaryValue">
                {metrics.bestHabitStreak}
              </strong>
            </div>
          </div>
        </article>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <div className="cardHeader">
            <h3>Resumen de Goals</h3>
          </div>

          <div className="goalsSummaryPanel">
            <div className="goalsSummaryTop">
              <div className="goalsSummaryMainMetric">
                <span className="goalsSummaryLabel">Avance global</span>
                <strong className="goalsSummaryBigValue">
                  {metrics.globalGoalsProgress}%
                </strong>
              </div>
            </div>

            <div className="goalsSummaryProgressBlock">
              <div className="progressBarContainer goalsSummaryProgressBar">
                <div
                  className="progressBarFill"
                  style={{ width: `${metrics.globalGoalsProgress}%` }}
                ></div>
              </div>
              <span className="progressText">
                Progreso medio de los goals activos
              </span>
            </div>

            <div className="goalsMetricsGrid">
              <div className="goalsMetricCard">
                <span className="goalsMetricLabel">Activos</span>
                <strong className="goalsMetricValue">
                  {metrics.activeGoals}
                </strong>
              </div>

              <div className="goalsMetricCard">
                <span className="goalsMetricLabel">En progreso</span>
                <strong className="goalsMetricValue">
                  {metrics.goalsInProgress}
                </strong>
              </div>

              <div className="goalsMetricCard">
                <span className="goalsMetricLabel">Completados</span>
                <strong className="goalsMetricValue">
                  {metrics.completedGoals}
                </strong>
              </div>

              <div className="goalsMetricCard">
                <span className="goalsMetricLabel">Total</span>
                <strong className="goalsMetricValue">
                  {metrics.totalGoals}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboardCard">
          <div className="cardHeader">
            <h3>Actividad Semanal</h3>
          </div>

          <div className="weeklyBars">
            {metrics.weeklyStats.map((day, index) => {
              const heightPercent =
                habits.length > 0 ? (day.completed / habits.length) * 100 : 0;

              return (
                <div key={day.isoDate} className="weeklyBarItem">
                  <div className="weeklyBarTrack">
                    <div
                      className={`weeklyBarFill day${index}`}
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    ></div>
                  </div>
                  <span className="weeklyBarValue">{day.completed}</span>
                  <span className="weeklyBarLabel">{day.label}</span>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
};

export default ObjectivesDashboard;
