import React, { useEffect, useState } from "react";
import {
  EMPTY_HABIT_FORM,
  normalizeHabitForm,
} from "../utils/objectiveHelpers";

const HabitModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [form, setForm] = useState(EMPTY_HABIT_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        titulo: initialData.titulo || "",
        description: initialData.description || "",
        priority: initialData.priority || "Media",
        active: initialData.active ?? true,
      });
      return;
    }

    setForm(EMPTY_HABIT_FORM);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(normalizeHabitForm(form));
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="editModal habitModal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modalHeader">
          <h3>{initialData ? "Editar hábito" : "Crear hábito"}</h3>
          <button className="closeButton" onClick={onClose}>
            <i className="fa fa-times"></i>
          </button>
        </div>

        <div className="modalForm">
          <form className="objectiveForm" onSubmit={handleSubmit}>
            <div className="formRow">
              <div className="formGroup">
                <label htmlFor="habit-title">Título *</label>
                <input
                  id="habit-title"
                  type="text"
                  value={form.titulo}
                  onChange={(event) =>
                    handleChange("titulo", event.target.value)
                  }
                  placeholder="Ej. Estudiar 1h"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="habit-priority">Prioridad</label>
                <select
                  id="habit-priority"
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
                <label htmlFor="habit-description">Descripción</label>
                <textarea
                  id="habit-description"
                  rows="4"
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  placeholder="Describe el hábito"
                />
              </div>

              <div className="formGroup">
                <label className="checkboxRow" htmlFor="habit-active">
                  <input
                    id="habit-active"
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
                    : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HabitModal;
