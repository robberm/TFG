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
import {
  createManagedUserGoal,
  deleteManagedUserGoal,
  getManagedUserGoals,
  getManagedUsers,
  updateManagedUserGoal,
} from "./api/adminApi";
import { getCurrentUserProfile } from "./api/userApi";

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
  isGoalNumeric,
} from "./features/objectives/utils/objectiveHelpers";

const Objectives = () => {
  const { setErrorMessage } = useError();

  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedManagedUserId, setSelectedManagedUserId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [isHabitUpdating, setIsHabitUpdating] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);

  const loadObjectivesData = useCallback(
    async (showLoader = true, forcedManagedUserId = null) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const profile = await getCurrentUserProfile();
        const adminMode = profile?.role === "ADMIN";
        setIsAdmin(adminMode);

        if (adminMode) {
          const users = await getManagedUsers();
          const normalizedUsers = Array.isArray(users) ? users : [];
          setManagedUsers(normalizedUsers);

          if (normalizedUsers.length === 0) {
            setSelectedManagedUserId("");
            setGoals([]);
            setHabits([]);
            setLogs([]);
            return;
          }

          const targetUserId =
            forcedManagedUserId ||
            selectedManagedUserId ||
            String(normalizedUsers[0].id);

          setSelectedManagedUserId(String(targetUserId));

          const goalsResponse = await getManagedUserGoals(targetUserId);
          setGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
          setHabits([]);
          setLogs([]);
          return;
        }

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
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [selectedManagedUserId, setErrorMessage],
  );

  React.useEffect(() => {
    loadObjectivesData(true);
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
      setErrorMessage("El titulo del goal es obligatorio.");
      return;
    }

    if (isAdmin && !selectedManagedUserId) {
      setErrorMessage("Debes seleccionar un usuario subordinado.");
      return;
    }

    setIsSubmittingGoal(true);

    try {
      if (isAdmin) {
        if (selectedGoal) {
          await updateManagedUserGoal(selectedManagedUserId, selectedGoal.id, {
            titulo: payload.titulo,
            description: payload.description,
            priority: payload.priority,
            status: payload.status,
            isNumeric: payload.isNumeric,
            valorProgreso: payload.valorProgreso,
            valorObjetivo: payload.valorObjetivo,
            active: payload.active,
          });
        } else {
          await createManagedUserGoal(selectedManagedUserId, {
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
      } else if (selectedGoal) {
        const previousWasNumeric = isGoalNumeric(selectedGoal);
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

        if (
          payload.isNumeric &&
          previousWasNumeric &&
          previousProgress !== nextProgress
        ) {
          await updateGoalProgress(selectedGoal.id, {
            valorProgreso: nextProgress,
            notes: payload.notes || "Actualizacion de progreso desde frontend.",
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
      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo guardar el goal.");
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleHabitSubmit = async (payload) => {
    if (!payload.titulo.trim()) {
      setErrorMessage("El titulo del habito es obligatorio.");
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
      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo guardar el habito.");
    } finally {
      setIsSubmittingHabit(false);
    }
  };

  const handleGoalDelete = async (goal) => {
    const confirmed = window.confirm(`Seguro que quieres eliminar "${goal.titulo}"?`);
    if (!confirmed) return;

    try {
      if (isAdmin) {
        if (!selectedManagedUserId) {
          setErrorMessage("Debes seleccionar un usuario subordinado.");
          return;
        }

        await deleteManagedUserGoal(selectedManagedUserId, goal.id);
      } else {
        await deleteGoal(goal.id);
      }

      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el goal.");
    }
  };

  const handleHabitDelete = async (habit) => {
    const confirmed = window.confirm(`Seguro que quieres eliminar "${habit.titulo}"?`);
    if (!confirmed) return;

    try {
      await deleteHabit(habit.id);
      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el habito.");
    }
  };

  const handleToggleHabitToday = async (habit, shouldComplete) => {
    const todayIso = formatIsoDate(new Date());

    setIsHabitUpdating(true);

    setLogs((prevLogs) => {
      const filteredLogs = prevLogs.filter(
        (log) => !(log.objective?.id === habit.id && log.logDate === todayIso),
      );

      return [
        ...filteredLogs,
        {
          objective: { id: habit.id },
          logDate: todayIso,
          completed: shouldComplete,
        },
      ];
    });

    try {
      await markHabitCompletion(habit.id, {
        date: todayIso,
        completed: shouldComplete,
      });

      await loadObjectivesData(false);
    } catch (error) {
      await loadObjectivesData(false);
      setErrorMessage(error.message || "No se pudo actualizar el habito.");
    } finally {
      setIsHabitUpdating(false);
    }
  };

  return (
    <div className="objectivesPage">
      <div className="pageHeader objectivesHeader">
        <div>
          <h1>Objetivos</h1>
          <p>
            {isAdmin
              ? "Asignación y seguimiento de goals de usuarios subordinados"
              : "Goals a largo plazo, habitos diarios y estadisticas"}
          </p>
        </div>

        {isAdmin && (
          <div className="adminUserSelector">
            <label htmlFor="objectives-managed-user">Usuario subordinado</label>
            <select
              id="objectives-managed-user"
              value={selectedManagedUserId}
              onChange={(event) =>
                loadObjectivesData(false, event.target.value)
              }
            >
              {managedUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="objectivesLoadingState">
          <span className="loaderDot"></span>
          <span>Cargando objetivos...</span>
        </div>
      ) : isAdmin ? (
        <div className="objectivesContent">
          <GoalsSection
            goals={goals}
            onCreate={openCreateGoalModal}
            onEdit={openEditGoalModal}
            onDelete={handleGoalDelete}
          />
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
        isAdmin={isAdmin}
        managedUsers={managedUsers}
        selectedUserId={selectedManagedUserId}
        onTargetUserChange={(userId) => setSelectedManagedUserId(userId)}
      />

      {!isAdmin && (
        <HabitModal
          isOpen={isHabitModalOpen}
          initialData={selectedHabit}
          onClose={closeHabitModal}
          onSubmit={handleHabitSubmit}
          isSubmitting={isSubmittingHabit}
        />
      )}
    </div>
  );
};

export default Objectives;
