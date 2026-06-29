import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const BAR_GRADIENTS = [
  ["#f093fb", "#f5576c"],
  ["#fa709a", "#fee140"],
  ["#43e97b", "#38f9d7"],
  ["#4facfe", "#00f2fe"],
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#fa709a", "#fee140"],
];

const HabitXAxisTick = ({ x, y, payload }) => {
  const day = payload?.payload;
  const selectedClass = day?.isSelected ? " selected" : "";

  return (
    <g transform={`translate(${x},${y})`} className={`weeklyBarAxisTick${selectedClass}`}>
      <text textAnchor="middle">
        <tspan className="weeklyBarValue" x="0" dy="0">
          {day?.completed ?? 0}
        </tspan>
        <tspan className="weeklyBarLabel" x="0" dy="18">
          {day?.label}
        </tspan>
      </text>
    </g>
  );
};

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
        gradientId: `habit-bar-gradient-${day.isoDate}`,
        gradient: BAR_GRADIENTS[index % BAR_GRADIENTS.length],
        chartValue:
          totalHabits > 0 ? Math.max((day.completed / totalHabits) * 100, 5) : 5,
        isSelected: day.isoDate === selectedDate,
        isFuture: day.isoDate > todayIso,
      })),
    [data, selectedDate, todayIso, totalHabits],
  );

  const handleBarClick = (day) => {
    if (!day?.isFuture) {
      onSelectDate(day.isoDate);
    }
  };

  return (
    <div className="habitBarChart" aria-label="Weekly habit completion chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 8, bottom: 42, left: 8 }}
          barSize={40}
          barCategoryGap="auto"
          onClick={(state) => handleBarClick(state?.activePayload?.[0]?.payload)}
        >
          <defs>
            {chartData.map((day) => {
              const [startColor, endColor] = day.gradient;

              return (
                <linearGradient key={day.gradientId} id={day.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={startColor} />
                  <stop offset="100%" stopColor={endColor} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid vertical={false} horizontal={false} />
          <YAxis hide domain={[0, 100]} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            height={40}
            tick={<HabitXAxisTick />}
          />
          <Bar
            dataKey="chartValue"
            radius={[10, 10, 10, 10]}
            background={{ className: "weeklyBarTrack", radius: 10 }}
            isAnimationActive
            animationDuration={400}
          >
            {chartData.map((day) => (
              <Cell
                key={day.isoDate}
                className={`weeklyBarCell${day.isSelected ? " selectedWeeklyBarCell" : ""}`}
                cursor={day.isFuture ? "not-allowed" : "pointer"}
                fill={`url(#${day.gradientId})`}
                opacity={day.isFuture ? 0.45 : 1}
                stroke={day.isSelected ? "var(--text-main)" : "transparent"}
                strokeOpacity={day.isSelected ? 0.18 : 0}
                strokeWidth={day.isSelected ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HabitBarChart;
