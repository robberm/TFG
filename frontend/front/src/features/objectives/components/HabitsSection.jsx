import React from "react";
import { formatIsoDate } from "../utils/objectiveHelpers";

const HabitsSection = ({
  habits,
  habitCompletionMap,
  onCreate,
  onEdit,
  onDelete,
  onToggleToday,
  isHabitUpdating,
}) => {
  const todayIso = formatIsoDate(new Date());

  return (
    <section className="objectivesSection">
      <div className="sectionHeader">
        <div>
          <h2>Hábitos</h2>
          <p>Seguimiento diario con rachas y estadísticas</p>
        </div>

        <button className="addButton" onClick={onCreate}>
          <i className="fa fa-plus"></i> Nuevo Hábito
        </button>
      </div>

      <div className="tableWrapper">
        <div className="todoTable">
          <div className="tableRow tableHeader">
            <div className="tableCell">Hoy</div>
            <div className="tableCell">Título</div>
            <div className="tableCell">Descripción</div>
            <div className="tableCell">Racha</div>
            <div className="tableCell">Mejor</div>
            <div className="tableCell">Acciones</div>
          </div>

          {habits.length === 0 ? (
            <div className="emptyState">
              <p>No hay hábitos creados. Comienza añadiendo uno.</p>
            </div>
          ) : (
            habits.map((habit) => {
              const isCompletedToday =
                habitCompletionMap[habit.id] &&
                habitCompletionMap[habit.id][todayIso] === true;

              return (
                <div
                  key={habit.id}
                  className={`tableRow ${isCompletedToday ? "completedTableRow" : ""}`}
                >
                  <div className="tableCell checkboxCell">
                    <label className="habitCheckbox">
                      <input
                        type="checkbox"
                        checked={Boolean(isCompletedToday)}
                        disabled={isHabitUpdating}
                        onChange={() => onToggleToday(habit, !isCompletedToday)}
                      />
                      <span className="habitCheckboxVisual"></span>
                    </label>
                  </div>

                  <div className="tableCell">
                    <strong className={isCompletedToday ? "completedText" : ""}>
                      {habit.titulo}
                    </strong>
                  </div>

                  <div className="tableCell">
                    <span className={isCompletedToday ? "completedText" : ""}>
                      {habit.description || "—"}
                    </span>
                  </div>

                  <div className="tableCell">
                    <span className="streakBadge">
                      {habit.currentStreak || 0}
                    </span>
                  </div>

                  <div className="tableCell">
                    <span className="streakBadge secondary">
                      {habit.bestStreak || 0}
                    </span>
                  </div>

                  <div className="tableCell actionsCell">
                    <button
                      className="actionButton editButton"
                      onClick={() => onEdit(habit)}
                      title="Editar"
                    >
                      <i className="fa fa-edit"></i>
                    </button>

                    <button
                      className="actionButton deleteButton"
                      onClick={() => onDelete(habit)}
                      title="Eliminar"
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

export default HabitsSection;
