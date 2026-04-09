import React from "react";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  calculateGoalProgressPercent,
  getPriorityColor,
} from "../utils/objectiveHelpers";

const GoalsSection = ({ goals, onCreate, onEdit, onDelete }) => {
  return (
    <section className="objectivesSection">
      <div className="sectionHeader">
        <div>
          <h2>Goals</h2>
          <p>Metas grandes con progreso e histórico.</p>
        </div>

        <button className="addButton" onClick={onCreate}>
          <i className="fa fa-plus"></i> Añadir goal
        </button>
      </div>

      <div className="tableWrapper">
        <div className="todoTable">
          <div className="tableRow tableHeader">
            <div className="tableCell">Título</div>
            <div className="tableCell">Descripción</div>
            <div className="tableCell">Prioridad</div>
            <div className="tableCell">Estado</div>
            <div className="tableCell">Progreso</div>
            <div className="tableCell">Acciones</div>
          </div>

          {goals.length === 0 ? (
            <div className="emptyState">
              <p>No hay goals todavía.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progressPercent = calculateGoalProgressPercent(goal);

              return (
                <div
                  key={goal.id}
                  className={`tableRow ${goal.status === "Done" ? "completedTableRow" : ""}`}
                >
                  <div className="tableCell">
                    <strong
                      className={goal.status === "Done" ? "completedText" : ""}
                    >
                      {goal.titulo}
                    </strong>
                  </div>

                  <div className="tableCell">
                    <span
                      className={goal.status === "Done" ? "completedText" : ""}
                    >
                      {goal.description || "Sin descripción"}
                    </span>
                  </div>

                  <div className="tableCell">
                    <span
                      className="priorityBadge"
                      style={{
                        backgroundColor: getPriorityColor(goal.priority),
                      }}
                    >
                      {goal.priority}
                    </span>
                  </div>

                  <div className="tableCell">
                    <span
                      className="statusBadge"
                      style={{
                        backgroundColor:
                          GOAL_STATUS_COLORS[goal.status] || "#6c757d",
                      }}
                    >
                      {GOAL_STATUS_LABELS[goal.status] || goal.status}
                    </span>
                  </div>

                  <div className="tableCell">
                    {goal.isNumeric ? (
                      <div className="goalProgressBlock">
                        <div className="progressBarContainer">
                          <div
                            className="progressBarFill"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="progressText">
                          {Number(goal.valorProgreso || 0)} /{" "}
                          {Number(goal.valorObjetivo || 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="mutedDash">-</span>
                    )}
                  </div>

                  <div className="tableCell actionsCell">
                    <button
                      className="actionButton editButton"
                      onClick={() => onEdit(goal)}
                    >
                      <i className="fa fa-edit"></i>
                    </button>

                    <button
                      className="actionButton deleteButton"
                      onClick={() => onDelete(goal)}
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default GoalsSection;
