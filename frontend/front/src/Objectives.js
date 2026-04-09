import React, { useCallback, useMemo, useState } from "react";
import { useError } from "./components/ErrorContext";
import "./css/Objectives.css";

import {
  createGoal,
  createHabit,
  deleteGoal,
  deleteHabit,
  getGoals,
  getHabits,
  getObjectiveLogsByRange,
  markHabitCompletion,
  updateGoal,
  updateGoalProgress,
  updateHabit,
} from "./api/objectivesApi";

import GoalModal from "./features/objectives/components/GoalModal";
import HabitModal from "./features/objectives/components/HabitModal";
import GoalsSection from "./features/objectives/components/GoalsSection";
import HabitsSection from "./features/objectives/components/HabitsSection";
import ObjectivesDashboard from "./features/objectives/components/ObjectivesDashboard";

import {
  buildHabitCompletionMap,
  formatIsoDate,
  getEndOfWeek,
  getStartOfWeek,
} from "./features/objectives/utils/objectiveHelpers";

const Objectives = () => {
  const { setErrorMessage } = useError();

  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [isHabitUpdating, setIsHabitUpdating] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const loadObjectivesData = useCallback(async () => {
    setIsLoading(true);

    try {
      const startOfWeek = getStartOfWeek(new Date());
      const endOfWeek = getEndOfWeek(startOfWeek);

      const [goalsResponse, habitsResponse, logsResponse] = await Promise.all([
        getGoals(),
        getHabits(),
        getObjectiveLogsByRange(
          formatIsoDate(startOfWeek),
          formatIsoDate(endOfWeek),
        ),
      ]);

      setGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
      setHabits(Array.isArray(habitsResponse) ? habitsResponse : []);
      setLogs(Array.isArray(logsResponse) ? logsResponse : []);
    } catch (error) {
      setErrorMessage(
        error.message || "No se pudo cargar la pantalla de objetivos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [setErrorMessage]);

  React.useEffect(() => {
    loadObjectivesData();
  }, [loadObjectivesData]);

  const habitCompletionMap = useMemo(
    () => buildHabitCompletionMap(logs),
    [logs],
  );

  const openCreateGoalModal = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const openCreateHabitModal = () => {
    setSelectedHabit(null);
    setIsHabitModalOpen(true);
  };

  const openEditHabitModal = (habit) => {
    setSelectedHabit(habit);
    setIsHabitModalOpen(true);
  };

  const closeGoalModal = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(false);
  };

  const closeHabitModal = () => {
    setSelectedHabit(null);
    setIsHabitModalOpen(false);
  };

  const handleGoalSubmit = async (payload) => {
    if (!payload.titulo.trim()) {
      setErrorMessage("El título del goal es obligatorio.");
      return;
    }

    setIsSubmittingGoal(true);

    try {
      if (selectedGoal) {
        const previousProgress = Number(selectedGoal.valorProgreso ?? 0);
        const nextProgress = payload.isNumeric
          ? Number(payload.valorProgreso ?? 0)
          : null;

        await updateGoal(selectedGoal.id, {
          titulo: payload.titulo,
          description: payload.description,
          priority: payload.priority,
          status: payload.status,
          isNumeric: payload.isNumeric,
          valorProgreso: payload.valorProgreso,
          valorObjetivo: payload.valorObjetivo,
          active: payload.active,
        });

        if (payload.isNumeric && previousProgress !== nextProgress) {
          await updateGoalProgress(selectedGoal.id, {
            valorProgreso: nextProgress,
            notes: payload.notes || "Actualización de progreso desde frontend.",
          });
        }
      } else {
        await createGoal({
          titulo: payload.titulo,
          description: payload.description,
          priority: payload.priority,
          status: payload.status,
          isNumeric: payload.isNumeric,
          valorProgreso: payload.valorProgreso,
          valorObjetivo: payload.valorObjetivo,
          active: payload.active,
        });
      }

      closeGoalModal();
      await loadObjectivesData();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo guardar el goal.");
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleHabitSubmit = async (payload) => {
    if (!payload.titulo.trim()) {
      setErrorMessage("El título del hábito es obligatorio.");
      return;
    }

    setIsSubmittingHabit(true);

    try {
      if (selectedHabit) {
        await updateHabit(selectedHabit.id, payload);
      } else {
        await createHabit(payload);
      }

      closeHabitModal();
      await loadObjectivesData();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo guardar el hábito.");
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  const handleGoalDelete = async (goal) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${goal.titulo}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteGoal(goal.id);
      await loadObjectivesData();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el goal.");
    }
  };

  const handleHabitDelete = async (habit) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${habit.titulo}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteHabit(habit.id);
      await loadObjectivesData();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el hábito.");
    }
  };

  const handleToggleHabitToday = async (habit, shouldComplete) => {
    setIsHabitUpdating(true);

    try {
      await markHabitCompletion(habit.id, {
        date: formatIsoDate(new Date()),
        completed: shouldComplete,
        notes: shouldComplete
          ? "Marcado como completado hoy."
          : "Desmarcado desde frontend.",
      });

      await loadObjectivesData();
    } catch (error) {
      setErrorMessage(error.message || "No se pudo actualizar el hábito.");
    } finally {
      setIsHabitUpdating(false);
    }
  };

  return (
    <div className="objectivesPage">
      <div className="pageHeader objectivesHeader">
        <div>
          <h1>Objectives</h1>
          <p>Goals a largo plazo, hábitos diarios y estadísticas semanales.</p>
        </div>

        <button
          className="refreshButton"
          onClick={loadObjectivesData}
          disabled={isLoading}
        >
          <i className="fa fa-rotate-right"></i> Recargar
        </button>
      </div>

      {isLoading ? (
        <div className="objectivesLoadingState">
          <span className="loaderDot"></span>
          <span>Cargando objetivos...</span>
        </div>
      ) : (
        <>
          <ObjectivesDashboard goals={goals} habits={habits} logs={logs} />

          <div className="objectivesContent">
            <HabitsSection
              habits={habits}
              habitCompletionMap={habitCompletionMap}
              onCreate={openCreateHabitModal}
              onEdit={openEditHabitModal}
              onDelete={handleHabitDelete}
              onToggleToday={handleToggleHabitToday}
              isHabitUpdating={isHabitUpdating}
            />

            <GoalsSection
              goals={goals}
              onCreate={openCreateGoalModal}
              onEdit={openEditGoalModal}
              onDelete={handleGoalDelete}
            />
          </div>
        </>
      )}

      <GoalModal
        isOpen={isGoalModalOpen}
        initialData={selectedGoal}
        onClose={closeGoalModal}
        onSubmit={handleGoalSubmit}
        isSubmitting={isSubmittingGoal}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        initialData={selectedHabit}
        onClose={closeHabitModal}
        onSubmit={handleHabitSubmit}
        isSubmitting={isSubmittingHabit}
      />
    </div>
  );
};

export default Objectives;
