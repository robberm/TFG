import React, { useEffect, useMemo, useState } from "react";
import "./css/PieChart.css";
import { useError } from "./components/ErrorContext";
import { getGoals } from "./api/objectivesApi";
import {
  GOAL_STATUS_LABELS,
  buildGoalStatusDistribution,
} from "./features/objectives/utils/objectiveHelpers";

export default function PieChart({ goals: externalGoals = null }) {
  const [goals, setGoals] = useState(
    Array.isArray(externalGoals) ? externalGoals : [],
  );
  const { setErrorMessage } = useError();

  useEffect(() => {
    if (Array.isArray(externalGoals)) {
      setGoals(externalGoals);
      return;
    }

    const loadGoals = async () => {
      try {
        const response = await getGoals();
        setGoals(Array.isArray(response) ? response : []);
      } catch (error) {
        setErrorMessage(error.message || "No se pudieron cargar los goals.");
        setGoals([]);
      }
    };

    loadGoals();
  }, [externalGoals, setErrorMessage]);

  const metrics = useMemo(() => {
    const goalDistribution = buildGoalStatusDistribution(goals);

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
        : "conic-gradient(rgba(255,255,255,0.1) 0deg 360deg)";

    return {
      goalDistribution,
      donutBackground,
      totalGoals: goals.length,
    };
  }, [goals]);

  if (!goals || goals.length === 0) {
    return (
      <div className="chartContainer">
        <div className="emptyState">
          <p>No hay goals para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chartContainer">
      <div className="donutChartLayout">
        <div
          className="goalsDonut"
          style={{ background: metrics.donutBackground }}
        >
          <div className="goalsDonutCenter">
            <span>{metrics.totalGoals}</span>
            <small>Total</small>
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
    </div>
  );
}
