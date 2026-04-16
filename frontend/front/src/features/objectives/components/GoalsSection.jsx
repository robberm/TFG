import React, { useMemo, useState } from "react";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  getGoalTrackingPercent,
  getPriorityColor,
  sortGoalsByPriority,
} from "../utils/objectiveHelpers";

const GoalsSection = ({ goals, onCreate, onEdit, onDelete }) => {
  const [showCompleted, setShowCompleted] = useState(false);

  /**
   * Goals activos:
   * - no completados
   * - activos
   * - ordenados por prioridad
   */
  const activeGoals = useMemo(
    () =>
      sortGoalsByPriority(
        goals.filter((goal) => goal.status !== "Done" && goal.active !== false),
      ),
    [goals],
  );

  /**
   * Goals completados o inactivos, que se mostrarán en la sección plegable.
   */
  const completedGoals = useMemo(
    () =>
      sortGoalsByPriority(
        goals.filter((goal) => goal.status === "Done" || goal.active === false),
      ),
    [goals],
  );

  /**
   * Renderiza las filas de la tabla.
   * En la columna progreso pintamos la progress bar tanto para numéricos
   * como para no numéricos, utilizando el helper getGoalTrackingPercent().
   */
  const renderGoalRows = (goalList) =>
    goalList.map((goal) => {
      const trackingPercent = getGoalTrackingPercent(goal);

      return (
        <div
          key={goal.id}
          className={`tableRow ${goal.status === "Done" ? "completedTableRow" : ""}`}
        >
          <div className="tableCell">
            <strong className={goal.status === "Done" ? "completedText" : ""}>
              {goal.titulo}
              {goal.assignedByAdmin && (
                <span className="ownerTag assigned">Asignado</span>
              )}
            </strong>
          </div>

          <div className="tableCell">
            <span className={goal.status === "Done" ? "completedText" : ""}>
              {goal.description || "—"}
              {goal.assignedByAdmin && goal.assignedByAdminUsername && (
                <div className="goalMetaText">Por: {goal.assignedByAdminUsername}</div>
              )}
              {!goal.assignedByAdmin && (
                <div className="goalMetaText">Creado por ti</div>
              )}
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
                backgroundColor: GOAL_STATUS_COLORS[goal.status] || "#6c757d",
              }}
            >
              {GOAL_STATUS_LABELS[goal.status] || goal.status}
            </span>
          </div>

          <div className="tableCell">
            <div className="goalProgressBlock">
              <div className="progressBarContainer">
                <div
                  className="progressBarFill"
                  style={{ width: `${trackingPercent}%` }}
                ></div>
              </div>

              <span className="progressText">
                {goal.isNumeric
                  ? `${Number(goal.valorProgreso || 0)} / ${Number(goal.valorObjetivo || 0)}`
                  : GOAL_STATUS_LABELS[goal.status] || goal.status}
              </span>
            </div>
          </div>

          <div className="tableCell actionsCell">
            <button
              className="actionButton editButton"
              onClick={() => onEdit(goal)}
              title="Editar"
            >
              <i className="fa fa-edit"></i>
            </button>

            <button
              className="actionButton deleteButton"
              onClick={() => onDelete(goal)}
              title="Eliminar"
            >
              <i className="fa fa-trash"></i>
            </button>
          </div>
        </div>
      );
    });

  return (
    <section className="objectivesSection">
      <div className="sectionHeader">
        <div>
          <h2>Goals</h2>
          <p>Metas a largo plazo con seguimiento de progreso</p>
        </div>

        <button className="addButton" onClick={onCreate}>
          <i className="fa fa-plus"></i> Nuevo Goal
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

          {activeGoals.length === 0 ? (
            <div className="emptyState">
              <p>No hay goals activos. Comienza añadiendo uno.</p>
            </div>
          ) : (
            renderGoalRows(activeGoals)
          )}
        </div>
      </div>

      {completedGoals.length > 0 && (
        <div className="completedGoalsBlock">
          <button
            type="button"
            className="completedGoalsToggle"
            onClick={() => setShowCompleted((prev) => !prev)}
          >
            <span>
              {showCompleted
                ? "Ocultar completados"
                : `Mostrar completados (${completedGoals.length})`}
            </span>
            <i
              className={`fa ${showCompleted ? "fa-chevron-up" : "fa-chevron-down"}`}
            ></i>
          </button>

          {showCompleted && (
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
                {renderGoalRows(completedGoals)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default GoalsSection;
