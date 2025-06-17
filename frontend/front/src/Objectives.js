import React, { useState, useEffect } from 'react';
import { useError } from './components/ErrorContext';
import './css/Objectives.css';

const Objectives = () => {
  const [objectives, setObjectives] = useState([]);
  const [objectiveId, setObjectiveId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newObjective, setNewObjective] = useState({
    titulo: "",
    description: "",
    priority: "Media",
    status: "NotStarted",
    isNumeric: false,
    valorProgreso: "",
    valorObjetivo: "",
  });
  const { setErrorMessage } = useError();

  /* GET ALL OBJECTIVES IN LIST */
  useEffect(() => {
    const getObjectives = async function () {
      const username = localStorage.getItem("username");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8080/objectives/${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const objectiveList = await response.json(); 
        setObjectives(objectiveList); 
      } else {
        setErrorMessage("Error al obtener objetivos.");
      }
    };

    getObjectives();
  }, [setErrorMessage]);
  
  

  useEffect(() => {
    if (showEditForm && objectiveId) {
      getObjective(objectiveId);
    }
  }, [showEditForm, objectiveId]);

  // Añadir nuevo objetivo
  const handleAddObjective = async (e) => {
    e.preventDefault();

    if (!newObjective.titulo.trim()) {
      setErrorMessage("El título es obligatorio.");
      return;
    }

    try {
      /* Obtengo el token de sesión*/
      const token = localStorage.getItem("token"); // Asegúrate de que el token está en el localStorage
      if (!token) {
        console.error("Token is missing, cannot proceed.");
        return;
      }

      const response = await fetch("http://localhost:8080/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Envio el token en la cabecera
        },
        body: JSON.stringify(newObjective),
      });

      if (response.ok) {
        const addedObjective = await response.json();
        setObjectives([...objectives, addedObjective]);

        setShowAddForm(false);
        clearObjective();
      } else {
        setErrorMessage("Error al añadir objetivo.");
      }
    } catch (error) {
      setErrorMessage("Error de conexión.");
    }
  };

  /* GET ONE OBJECTIVE */
  const getObjective = async function (id) {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:8080/objectives/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const objective = await response.json();

        setNewObjective({
          titulo: objective.titulo,
          description: objective.description,
          priority: objective.priority,
          status: objective.status,
          isNumeric: objective.isNumeric,
          valorProgreso: objective.valorProgreso ?? "",
          valorObjetivo: objective.valorObjetivo ?? "",
        });
      } else {
        console.error("No se pudo obtener el objetivo.");
      }
    } catch (error) {
      console.error("Error al obtener el objetivo:", error);
    }
  };

  const handleSaveEdit = async (formData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token is missing, cannot proceed.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/objectives/${objectiveId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const updatedObjective = await response.json();

        setObjectives((prevObjectives) =>
          prevObjectives.map((obj) =>
            obj.id === updatedObjective.id ? updatedObjective : obj
          )
        );

        setShowEditForm(false);
        setObjectiveId(null);
        clearObjective();
      } else {
        setErrorMessage("Error al actualizar objetivo.");
      }
    } catch (error) {
      setErrorMessage("Error de conexión.");
    }
  };

  const filterObjectives = () => {
    // Implementar filtro aquí si es necesario
    console.log("Filtrar objetivos");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Alta":
        return "#ff4757";
      case "Media":
        return "#ffa502";
      case "Baja":
        return "#2ed573";
      default:
        return "#747d8c";
    }
  };

  const clearObjective = () => {
    setNewObjective({
      titulo: "",
      description: "",
      priority: "Media",
      status: "NotStarted",
      isNumeric: false,
      valorProgreso: "",
      valorObjetivo: "",
    });
  };

  const changeStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:8080/objectives/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setObjectives((prev) =>
          prev.map((obj) =>
            obj.id === id ? { ...obj, status: updated.status } : obj
          )
        );
      } else {
        setErrorMessage("No se pudo actualizar el estado.");
      }
    } catch (err) {
      setErrorMessage("Error de conexión al actualizar el estado.");
    }
  };

  const frontendToBackendStatus = {
    "Sin empezar": "NotStarted",
    "En Progreso": "InProgress",
    Completado: "Done",
  };

  const backendToFrontendStatus = {
    NotStarted: "Sin empezar",
    InProgress: "En Progreso",
    Done: "Completado",
  };

  const renderObjectiveForm = ({ isEdit, onSubmit }) => (
    <div className="addObjectiveForm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(newObjective); 
        }}
      >
        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="titulo">Título *</label>
            <input
              type="text"
              id="titulo"
              value={newObjective.titulo}
              onChange={(e) =>
                setNewObjective({ ...newObjective, titulo: e.target.value })
              }
              placeholder="Ingresa el título del objetivo"
              required
            />
          </div>
          <div className="formGroup">
            <label htmlFor="priority">Prioridad</label>
            <select
              id="priority"
              value={newObjective.priority}
              onChange={(e) =>
                setNewObjective({ ...newObjective, priority: e.target.value })
              }
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
        </div>
        <div className="formRow">
          <div className="formGroup">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={newObjective.description}
              onChange={(e) =>
                setNewObjective({
                  ...newObjective,
                  description: e.target.value,
                })
              }
              placeholder="Describe el objetivo (opcional)"
              rows="3"
            />
          </div>
          <div className="formGroup">
            <label htmlFor="isNumeric">
              Is Numeric?
              <input
                type="checkbox"
                id="isNumeric"
                checked={newObjective.isNumeric}
                onChange={(e) =>
                  setNewObjective({
                    ...newObjective,
                    isNumeric: e.target.checked,
                  })
                }
              />
            </label>
          </div>
        </div>

        {newObjective.isNumeric === true && (
          <div className="formRow">
            <div className="formGroup">
              <label htmlFor="valorProgreso">Valor progreso</label>
              <input
                type="number"
                id="valorProgreso"
                value={newObjective.valorProgreso}
                onChange={(e) =>
                  setNewObjective({
                    ...newObjective,
                    valorProgreso: e.target.value,
                  })
                }
              />
            </div>

            <div className="formGroup">
              <label htmlFor="valorObjetivo">Valor de cumplimiento</label>
              <input
                type="number"
                id="valorObjetivo"
                value={newObjective.valorObjetivo}
                onChange={(e) =>
                  setNewObjective({
                    ...newObjective,
                    valorObjetivo: e.target.value,
                  })
                }
              />
            </div>
          </div>
        )}

        <div className="formActions">
          <button type="submit" className="saveButton">
            {isEdit ? "Actualizar" : "Guardar"}
          </button>
          <button
            type="button"
            className="cancelButton"
            onClick={() => {
              if (isEdit) setShowEditForm(false);
              else {
                setShowAddForm(false);
                clearObjective();
              }
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="objectivesPage">
      {/*Main */}
      <div className="pageHeader">
        <h1>Objetivos</h1>
      </div>

      <div className="todoSection">
        <div className="todoHeader">
          <h2>Mis Objetivos</h2>
          <div className="headerActions">
            <button
              className="addButton"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="fa fa-plus"></i> Añadir Objetivo
            </button>
            <button className="filterButton" onClick={filterObjectives}>
              <i className="fa-solid fa-filter"></i>
            </button>
          </div>
        </div>

        {/* Formulario para añadir objetivo */}
        {showAddForm &&
          renderObjectiveForm({ isEdit: false, onSubmit: handleAddObjective })}

        {/* Tabla de objetivos */}
        <div className="todoTable">
          <div className="tableRow tableHeader">
            <div className="tableCell">Título</div>
            <div className="tableCell">Descripción</div>
            <div className="tableCell">Prioridad</div>
            <div className="tableCell statusCell">Status</div>
            <div className="tableCell">Progress</div>
            <div className="tableCell">Acciones</div>
          </div>

          {objectives.length === 0 ? (
            <div className="emptyState">
              <p>No hay objetivos todavía.</p>
              <button
                className="addFirstButton"
                onClick={() => setShowAddForm(true)}
              >
                Añadir tu primer objetivo
              </button>
            </div>
          ) : (
            objectives.map((objective) => (
              <div key={objective.id} className="tableRow">
                <div className="tableCell">
                  <strong>{objective.titulo}</strong> {/* ponerlo en bond*/}
                </div>
                <div className="tableCell">
                  {objective.description || "Sin descripción"}
                </div>
                <div className="tableCell">
                  <span
                    className="priorityBadge"
                    style={{
                      backgroundColor: getPriorityColor(objective.priority),
                    }}
                  >
                    {objective.priority === "Alta"
                      ? "Alta"
                      : objective.priority === "Media"
                      ? "Media"
                      : "Baja"}
                  </span>
                </div>
                <div className="tableCell">
                  <select
                    value={backendToFrontendStatus[objective.status]}
                    onChange={(e) =>
                      changeStatus(
                        objective.id,
                        frontendToBackendStatus[e.target.value]
                      )
                    }
                    className="statusDropdown"
                  >
                    <option value="Sin empezar">Sin empezar</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completado">Completado</option>
                  </select>
                </div>

                <div className="tableCell">
                  {objective.isNumeric ? (
                    <div className="progressBarContainer">
                      <div
                        className="progressBarFill"
                        style={{
                          width: `${
                            objective.valorObjetivo > 0
                              ? (objective.valorProgreso * 100) /
                                objective.valorObjetivo
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  ) : (
                    "-"
                  )}
                  {/* Las últimas 3 lineas es para denotar que si es Numeric enseña, si no, no.*/}
                </div>

                <div className="tableCell">
                  <button
                    className="actionButton editButton"
                    onClick={() => {
                      setShowEditForm(true);
                      setObjectiveId(objective.id);
                    }}
                  >
                    <i className="fa fa-edit"></i>
                  </button>
                  <button className="actionButton deleteButton">
                    <i className="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Modal de edición */}
      {showEditForm && (
        <div
          className="modalOverlay"
          onClick={() => {
            clearObjective();
          }}
        >
          <div className="editModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>Editar Objetivo</h3>
              <button
                className="closeButton"
                onClick={() => {
                  clearObjective();
                  setShowEditForm(false);
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modalForm">
              {renderObjectiveForm({ isEdit: true, onSubmit: handleSaveEdit })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Objectives;