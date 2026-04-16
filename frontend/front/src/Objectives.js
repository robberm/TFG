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
import { getCurrentUserProfile } from "./api/userApi";
import { getManagedUsers } from "./api/adminApi";

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isSubmittingHabit, setIsSubmittingHabit] = useState(false);
  const [isHabitUpdating, setIsHabitUpdating] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [profile, setProfile] = useState(null);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedManagedUserId, setSelectedManagedUserId] = useState(null);

  const isAdmin = profile?.role === "ADMIN";

  /**
   * Carga goals, hábitos y logs semanales.
   * El showLoader permite reutilizar esta misma función sin mostrar siempre
   * el estado de carga completo de la pantalla.
   */
  const loadSessionScope = useCallback(async () => {
    const currentProfile = await getCurrentUserProfile();
    setProfile(currentProfile);

    if (currentProfile?.role === "ADMIN") {
      const users = await getManagedUsers();
      const normalizedUsers = Array.isArray(users) ? users : [];
      setManagedUsers(normalizedUsers);
      setSelectedManagedUserId((previousId) => {
        if (
          previousId != null &&
          normalizedUsers.some((user) => user.id === previousId)
        ) {
          return previousId;
        }
        return normalizedUsers.length > 0 ? normalizedUsers[0].id : null;
      });
    } else {
      setManagedUsers([]);
      setSelectedManagedUserId(null);
    }
  }, []);

  const loadObjectivesData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const startOfWeek = getStartOfWeek(new Date());
        const endOfWeek = getEndOfWeek(startOfWeek);

        if (isAdmin) {
          const goalsResponse = await getGoals(selectedManagedUserId);
          setGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
          setHabits([]);
          setLogs([]);
        } else {
          const [goalsResponse, habitsResponse, logsResponse] = await Promise.all(
            [
              getGoals(),
              getHabits(),
              getObjectiveLogsByRange(
                formatIsoDate(startOfWeek),
                formatIsoDate(endOfWeek),
              ),
            ],
          );

          setGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
          setHabits(Array.isArray(habitsResponse) ? habitsResponse : []);
          setLogs(Array.isArray(logsResponse) ? logsResponse : []);
        }
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
    [isAdmin, selectedManagedUserId, setErrorMessage],
  );

  React.useEffect(() => {
    const initialize = async () => {
      try {
        await loadSessionScope();
      } catch (error) {
        setErrorMessage(error.message || "No se pudo cargar el contexto.");
      }
    };

    initialize();
  }, [loadSessionScope, setErrorMessage]);

  React.useEffect(() => {
    if (!profile) {
      return;
    }
    loadObjectivesData(true);
  }, [loadObjectivesData, profile]);

  /**
   * Mapa auxiliar para consultar rápidamente si un hábito está completado
   * en una fecha concreta.
   */
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

  /**
   * Guarda un goal nuevo o actualiza uno existente.
   * Si el goal es numérico y cambia el progreso, registramos también
   * el cambio en el histórico.
   */
  const handleGoalSubmit = async (payload) => {
    if (!payload.titulo.trim()) {
      setErrorMessage("El titulo del goal es obligatorio.");
      return;
    }

    if (isAdmin) {
      const invalidSingle = !payload.assignToAllUsers && (!payload.targetUserIds || payload.targetUserIds.length === 0) && !payload.targetUserId;
      if (invalidSingle) {
        setErrorMessage("Debes seleccionar al menos un usuario subordinado.");
        return;
      }
    }

    setIsSubmittingGoal(true);

    try {
      if (selectedGoal) {
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
          targetUserId: isAdmin ? payload.targetUserId : null,
          targetUserIds: isAdmin ? payload.targetUserIds : null,
          assignToAllUsers: isAdmin ? payload.assignToAllUsers : false,
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

  /**
   * Guarda un hábito nuevo o actualiza uno existente.
   */
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

  /**
   * Elimina un goal tras confirmación del usuario.
   */
  const handleGoalDelete = async (goal) => {
    const confirmed = window.confirm(
      `Seguro que quieres eliminar "${goal.titulo}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteGoal(goal.id);
      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el goal.");
    }
  };

  /**
   * Elimina un hábito tras confirmación del usuario.
   */
  const handleHabitDelete = async (habit) => {
    const confirmed = window.confirm(
      `Seguro que quieres eliminar "${habit.titulo}"?`,
    );
    if (!confirmed) return;

    try {
      await deleteHabit(habit.id);
      await loadObjectivesData(false);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el habito.");
    }
  };

  /**
   * Marca o desmarca un hábito para hoy.
   * Primero actualizamos la UI de forma optimista y luego sincronizamos
   * con backend. Si falla, recargamos el estado real.
   */
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

    setHabits((prevHabits) =>
      prevHabits.map((currentHabit) => {
        if (currentHabit.id !== habit.id) {
          return currentHabit;
        }

        const currentStreak = Number(currentHabit.currentStreak || 0);
        const bestStreak = Number(currentHabit.bestStreak || 0);

        if (shouldComplete) {
          const updatedStreak = currentStreak + 1;

          return {
            ...currentHabit,
            currentStreak: updatedStreak,
            bestStreak: Math.max(bestStreak, updatedStreak),
          };
        }

        return {
          ...currentHabit,
          currentStreak: Math.max(0, currentStreak - 1),
        };
      }),
    );

    try {
      await markHabitCompletion(habit.id, {
        date: todayIso,
        completed: shouldComplete,
        notes: shouldComplete
          ? "Marcado como completado hoy."
          : "Desmarcado desde frontend.",
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
              ? "Asigna y supervisa goals de tus usuarios subordinados."
              : "Goals a largo plazo, habitos diarios y estadisticas"}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="adminScopeSelector">
          <label htmlFor="managed-user-goals">Usuario subordinado</label>
          <select
            id="managed-user-goals"
            value={selectedManagedUserId ?? ""}
            onChange={(event) =>
              setSelectedManagedUserId(
                event.target.value ? Number(event.target.value) : null,
              )
            }
          >
            <option value="">Todos los asignados</option>
            {managedUsers.length === 0 && (
              <option value="">Sin usuarios subordinados</option>
            )}
            {managedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="objectivesLoadingState">
          <span className="loaderDot"></span>
          <span>Cargando objetivos...</span>
        </div>
      ) : (
        <>
          {!isAdmin && (
            <ObjectivesDashboard goals={goals} habits={habits} logs={logs} />
          )}

          <div className="objectivesContent">
            {!isAdmin && (
              <HabitsSection
                habits={habits}
                habitCompletionMap={habitCompletionMap}
                onCreate={openCreateHabitModal}
                onEdit={openEditHabitModal}
                onDelete={handleHabitDelete}
                onToggleToday={handleToggleHabitToday}
                isHabitUpdating={isHabitUpdating}
              />
            )}

            <GoalsSection
              goals={goals}
              onCreate={openCreateGoalModal}
              onEdit={openEditGoalModal}
              onDelete={handleGoalDelete}
              isAdmin={isAdmin}
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
        defaultManagedUserId={selectedManagedUserId}
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
