import React, { useMemo } from "react";
import {
  GOAL_STATUS_LABELS,
  buildGoalStatusDistribution,
  buildWeeklyHabitStats,
  formatIsoDate,
  getStartOfWeek,
} from "../utils/objectiveHelpers";

const ObjectivesDashboard = ({ goals, habits, logs }) => {
  const todayIso = formatIsoDate(new Date());

  const metrics = useMemo(() => {
    const startOfWeek = getStartOfWeek(new Date());
    const weeklyStats = buildWeeklyHabitStats(habits, logs, startOfWeek);
    const goalDistribution = buildGoalStatusDistribution(goals);

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

    let startAngle = 0;
    const donutSegments = goalDistribution
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const endAngle = startAngle + segment.percent * 360;
        const cssSegment = `${segment.color} ${startAngle}deg ${endAngle}deg`;
        startAngle = endAngle;
        return cssSegment;
      });

    const donutBackground =
      donutSegments.length > 0
        ? `conic-gradient(${donutSegments.join(", ")})`
        : "conic-gradient(#3b3b3b 0deg 360deg)";

    return {
      completedToday,
      weeklyRate,
      bestHabitStreak,
      goalDistribution,
      weeklyStats,
      donutBackground,
    };
  }, [goals, habits, logs, todayIso]);

  const maxWeeklyCompleted = Math.max(
    ...metrics.weeklyStats.map((item) => item.completed),
    1,
  );

  return (
    <section className="objectivesDashboard">
      <div className="summaryCardsGrid">
        <article className="summaryCard">
          <span className="summaryLabel">Goals activos</span>
          <strong className="summaryValue">
            {goals.filter((goal) => goal.active !== false).length}
          </strong>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Hábitos completados hoy</span>
          <strong className="summaryValue">
            {metrics.completedToday}/{habits.length}
          </strong>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Cumplimiento semanal</span>
          <strong className="summaryValue">{metrics.weeklyRate}%</strong>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Mejor racha</span>
          <strong className="summaryValue">
            {metrics.bestHabitStreak} días
          </strong>
        </article>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <div className="cardHeader">
            <h3>Distribución de goals</h3>
          </div>

          <div className="donutChartLayout">
            <div
              className="goalsDonut"
              style={{ background: metrics.donutBackground }}
            >
              <div className="goalsDonutCenter">
                <span>{goals.length}</span>
                <small>Goals</small>
              </div>
            </div>

            <div className="donutLegend">
              {metrics.goalDistribution.map((segment) => (
                <div key={segment.key} className="legendItem">
                  <span
                    className="legendColor"
                    style={{ backgroundColor: segment.color }}
                  ></span>
                  <span className="legendText">
                    {GOAL_STATUS_LABELS[segment.key]} ({segment.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="dashboardCard">
          <div className="cardHeader">
            <h3>Hábitos completados esta semana</h3>
          </div>

          <div className="weeklyBars">
            {metrics.weeklyStats.map((day) => (
              <div key={day.isoDate} className="weeklyBarItem">
                <div className="weeklyBarTrack">
                  <div
                    className="weeklyBarFill"
                    style={{
                      height: `${(day.completed / maxWeeklyCompleted) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="weeklyBarValue">{day.completed}</span>
                <span className="weeklyBarLabel">{day.label}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};

export default ObjectivesDashboard;
