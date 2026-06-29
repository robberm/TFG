import React, { useMemo } from "react";

const BAR_GRADIENTS = [
  ["#f093fb", "#f5576c"],
  ["#fa709a", "#fee140"],
  ["#43e97b", "#38f9d7"],
  ["#4facfe", "#00f2fe"],
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#fa709a", "#fee140"],
];

const HabitBarChart = ({
  data,
  totalHabits,
  selectedDate,
  todayIso,
  onSelectDate,
}) => {
  const chartData = useMemo(
    () =>
      data.map((day, index) => ({
        ...day,
        gradient: BAR_GRADIENTS[index % BAR_GRADIENTS.length],
        heightPercent:
          totalHabits > 0 ? Math.max((day.completed / totalHabits) * 100, 5) : 5,
        isSelected: day.isoDate === selectedDate,
        isFuture: day.isoDate > todayIso,
      })),
    [data, selectedDate, todayIso, totalHabits],
  );

  return (
    <div className="habitBarChart" role="group" aria-label="Weekly habit completion chart">
      {chartData.map((day, index) => {
        const [startColor, endColor] = day.gradient;
        const gradientId = `habit-bar-gradient-${day.isoDate}`;

        return (
          <button
            key={day.isoDate}
            type="button"
            className={`weeklyBarItem ${day.isSelected ? "selectedWeeklyBarItem" : ""}`}
            onClick={() => onSelectDate(day.isoDate)}
            disabled={day.isFuture}
            aria-pressed={day.isSelected}
            title={day.isoDate}
          >
            <svg className="weeklyBarSvg" viewBox="0 0 40 144" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={startColor} />
                  <stop offset="100%" stopColor={endColor} />
                </linearGradient>
              </defs>
              <rect className="weeklyBarTrack" x="0" y="0" width="40" height="144" rx="10" />
              <rect
                className="weeklyBarFill"
                x="0"
                y={144 - (144 * day.heightPercent) / 100}
                width="40"
                height={(144 * day.heightPercent) / 100}
                rx="10"
                fill={`url(#${gradientId})`}
              />
            </svg>
            <span className="weeklyBarValue">{day.completed}</span>
            <span className="weeklyBarLabel">{day.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default HabitBarChart;
