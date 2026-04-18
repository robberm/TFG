import React, { useEffect, useState } from "react";
import {
  EMPTY_GOAL_FORM,
  isGoalNumeric,
  normalizeGoalForm,
  toInputNumberValue,
} from "../utils/objectiveHelpers";

const GoalModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  isAdmin = false,
  managedUsers = [],
  defaultManagedUserId = null,
}) => {
  const [form, setForm] = useState(EMPTY_GOAL_FORM);

  /**
   * Cuando abrimos el modal en modo edición, cargamos los datos del goal.
   * Ojo con isNumeric, porque puede venir serializado de distintas formas
   * y por eso utilizamos el helper isGoalNumeric().
   */
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const numericGoal = isGoalNumeric(initialData);

      setForm({
        titulo: initialData.titulo || "",
        description: initialData.description || "",
        priority: initialData.priority || "Media",
        status: initialData.status || "NotStarted",
        isNumeric: numericGoal,
        valorProgreso: numericGoal
          ? toInputNumberValue(initialData.valorProgreso)
          : "",
        valorObjetivo: numericGoal
          ? toInputNumberValue(initialData.valorObjetivo)
          : "",
        active: initialData.active ?? true,
        notes: "",
        targetUserId: defaultManagedUserId ?? "",
        targetUserIds: defaultManagedUserId != null ? [String(defaultManagedUserId)] : [],
        assignmentMode: "single",
      });
      return;
    }

    setForm({
      ...EMPTY_GOAL_FORM,
      targetUserId: defaultManagedUserId ?? "",
      targetUserIds: defaultManagedUserId != null ? [String(defaultManagedUserId)] : [],
      assignmentMode: "single",
    });
  }, [defaultManagedUserId, initialData, isOpen]);

  if (!isOpen) return null;

  /**
   * Actualiza un campo concreto del formulario.
   */
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Si activamos o desactivamos el modo numérico,
   * mostramos u ocultamos los campos asociados.
   */
  const handleNumericToggle = (checked) => {
    setForm((prev) => ({
      ...prev,
      isNumeric: checked,
      valorProgreso: checked ? prev.valorProgreso : "",
      valorObjetivo: checked ? prev.valorObjetivo : "",
      notes: checked ? prev.notes : "",
    }));
  };

  const toggleTargetSelection = (value) => {
    setForm((prev) => {
      const current = prev.targetUserIds || [];
      const alreadySelected = current.includes(String(value));

      return {
        ...prev,
        targetUserIds: alreadySelected
          ? current.filter((item) => item !== String(value))
          : [...current, String(value)],
      };
    });
  };

  /**
   * Normaliza el formulario antes de enviarlo al componente padre.
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const selectedUserIds = (form.targetUserIds || [])
            .map((value) => Number(value));

    const isNewGoalFromAdmin = isAdmin && !initialData;
    const normalizedForm = normalizeGoalForm(form);

    onSubmit({
      ...normalizedForm,
      status: isAdmin ? (initialData?.status || "NotStarted") : normalizedForm.status,
      notes: form.notes?.trim() || "",
      targetUserId:
        isAdmin && form.assignmentMode === "single" && form.targetUserId !== ""
          ? Number(form.targetUserId)
          : null,
      targetUserIds:
        isAdmin && form.assignmentMode === "multiple"
          ? selectedUserIds
          : null,
      assignToAllUsers: isAdmin && form.assignmentMode === "all",
      valorProgreso:
        isNewGoalFromAdmin && normalizedForm.isNumeric
          ? 0
          : normalizedForm.valorProgreso,
    });
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="editModal" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <h3>{initialData ? "Editar Goal" : "Nuevo Goal"}</h3>
          <button type="button" className="closeButton" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        <div className="modalForm">
          <form className="objectiveForm" onSubmit={handleSubmit}>
            <div className="formRow">
              {isAdmin && (
                <div className="formGroup">
                  <label htmlFor="goal-assignment-mode">Asignación</label>
                  <select
                    id="goal-assignment-mode"
                    value={form.assignmentMode}
                    onChange={(event) =>
                      handleChange("assignmentMode", event.target.value)
                    }
                  >
                    <option value="single">Usuario</option>
                    <option value="multiple">Varios usuarios</option>
                    <option value="all">Todos (organización)</option>
                  </select>

                  {form.assignmentMode === "single" && (
                    <select
                      id="goal-target-user"
                      value={form.targetUserId}
                      onChange={(event) =>
                        handleChange("targetUserId", event.target.value)
                      }
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {managedUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  )}

                  {form.assignmentMode === "multiple" && (
                    <div className="gcal-multi-targets">
                      {managedUsers.map((user) => (
                        <label key={user.id}>
                          <input
                            type="checkbox"
                            checked={form.targetUserIds?.includes(String(user.id))}
                            onChange={() => toggleTargetSelection(user.id)}
                          />
                          {user.username}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="formGroup">
                <label htmlFor="goal-title">Título</label>
                <input
                  id="goal-title"
                  type="text"
                  value={form.titulo}
                  onChange={(event) =>
                    handleChange("titulo", event.target.value)
                  }
                  placeholder="Ej. Terminar proyecto"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="goal-priority">Prioridad</label>
                <select
                  id="goal-priority"
                  value={form.priority}
                  onChange={(event) =>
                    handleChange("priority", event.target.value)
                  }
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <label htmlFor="goal-description">Descripción</label>
                <textarea
                  id="goal-description"
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  placeholder="Describe tu objetivo..."
                />
              </div>

              <div className="formGroup">
                <label htmlFor="goal-status">Estado</label>
                {isAdmin ? (
                  <input
                    id="goal-status"
                    type="text"
                    value={initialData?.status === "Done" ? "Completado" : initialData?.status === "InProgress" ? "En progreso" : "Sin empezar"}
                    readOnly
                    disabled
                  />
                ) : (
                  <select
                    id="goal-status"
                    value={form.status}
                    onChange={(event) =>
                      handleChange("status", event.target.value)
                    }
                  >
                    <option value="NotStarted">Sin empezar</option>
                    <option value="InProgress">En progreso</option>
                    <option value="Done">Completado</option>
                  </select>
                )}

                <label className="checkboxRow" htmlFor="goal-is-numeric">
                  <input
                    id="goal-is-numeric"
                    type="checkbox"
                    checked={form.isNumeric}
                    onChange={(event) =>
                      handleNumericToggle(event.target.checked)
                    }
                  />
                  Objetivo numérico
                </label>

                <label className="checkboxRow" htmlFor="goal-active">
                  <input
                    id="goal-active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      handleChange("active", event.target.checked)
                    }
                  />
                  Activo
                </label>
              </div>
            </div>

            {form.isNumeric && (
              <>
                <div className="formRow">
                  <div className="formGroup">
                    <label htmlFor="goal-progress">Valor actual</label>
                    <input
                      id="goal-progress"
                      type="number"
                      step="0.01"
                      value={form.valorProgreso}
                      onChange={(event) =>
                        handleChange("valorProgreso", event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="formGroup">
                    <label htmlFor="goal-target">Valor objetivo</label>
                    <input
                      id="goal-target"
                      type="number"
                      step="0.01"
                      value={form.valorObjetivo}
                      onChange={(event) =>
                        handleChange("valorObjetivo", event.target.value)
                      }
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="formRow singleColumn">
                  <div className="formGroup">
                    <label htmlFor="goal-notes">Nota del progreso</label>
                    <textarea
                      id="goal-notes"
                      rows="2"
                      value={form.notes}
                      onChange={(event) =>
                        handleChange("notes", event.target.value)
                      }
                      placeholder="Opcional: nota para el historial de progreso"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="formActions">
              <button type="button" className="cancelButton" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="saveButton"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Guardando..."
                  : initialData
                    ? "Actualizar"
                    : "Crear Goal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
