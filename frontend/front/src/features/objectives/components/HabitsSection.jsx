import React from "react";
import { formatIsoDate } from "../utils/objectiveHelpers";
import { useLanguage } from "../../../context/languageContext";

const HabitsSection = ({
  habits,
  habitCompletionMap,
  onCreate,
  onEdit,
  onDelete,
  onToggleToday,
  isHabitUpdating,
}) => {
  const { t } = useLanguage();
  const todayIso = formatIsoDate(new Date());

  return (
    <section className="objectivesSection">
      <div className="sectionHeader">
        <div>
          <h2>{t.habitsTitle}</h2>
          <p>{t.habitsSubtitle}</p>
        </div>

        <button className="addButton" onClick={onCreate}>
          <i className="fa fa-plus"></i> {t.habitsNew}
        </button>
      </div>

      <div className="tableWrapper">
        <div className="todoTable">
          <div className="tableRow tableHeader">
            <div className="tableCell">{t.commonToday}</div>
            <div className="tableCell">{t.commonTitle}</div>
            <div className="tableCell">{t.commonDescription}</div>
            <div className="tableCell">{t.habitsStreak}</div>
            <div className="tableCell">{t.habitsBest}</div>
            <div className="tableCell">{t.commonActions}</div>
          </div>

          {habits.length === 0 ? (
            <div className="emptyState">
              <p>{t.habitsEmpty}</p>
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
                      title={t.commonEdit}
                    >
                      <i className="fa fa-edit"></i>
                    </button>

                    <button
                      className="actionButton deleteButton"
                      onClick={() => onDelete(habit)}
                      title={t.commonDelete}
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
