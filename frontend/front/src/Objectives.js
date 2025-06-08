import React, { useState, useEffect } from 'react';
import { useError } from './components/ErrorContext';
import './css/Objectives.css';

const Objectives = () => {
  const [objectives, setObjectives] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newObjective, setNewObjective] = useState({
    titulo: '',
    description: '',
    priority: 'Media',
    
  });
  const { setErrorMessage } = useError();

  
  useEffect(() => {

    
    const getObjectives = async function(){
    const username = localStorage.getItem("username");  
    const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:8080/objectives/${username}`, {
        method: "GET",
        headers: {
          "Content-Type" : "application/json",
           "Authorization": `Bearer ${token}`,
        },
      });

      if(response.ok){
        setObjectives(await response.json());
      }else{
        setErrorMessage("Error al obtener objetivos.");
      }
    }

    getObjectives();
  }, [setErrorMessage]);

  // Añadir nuevo objetivo
  const handleAddObjective = async (e) => {
    e.preventDefault();
    
    if (!newObjective.titulo.trim()) {
      setErrorMessage("El título es obligatorio.");
      return;
    }

    try {
  /* Obtengo el token de sesión*/
     const token = localStorage.getItem("token");  // Asegúrate de que el token está en el localStorage
       if (!token) {
       console.error("Token is missing, cannot proceed.");
       return;
        }

      
      const response = await fetch("http://localhost:8080/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,   // Envio el token en la cabecera
        },
        body: JSON.stringify(newObjective),
      });

      if (response.ok) {
        const addedObjective = await response.json();
        setObjectives([...objectives, addedObjective]);
        setNewObjective({ titulo: '', description: '', priority: 'medium' });
        setShowAddForm(false);
      } else {
        setErrorMessage("Error al añadir objetivo.");
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
    switch(priority) {
      case 'Alta': return '#ff4757';
      case 'Media': return '#ffa502';
      case 'Baja': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const clearObjective = async function(){
    setNewObjective({
        titulo: '',
    priority: 'Media',
    description: ''
    })
  }

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
        {showAddForm && (
          <div className="addObjectiveForm">
            <form onSubmit={handleAddObjective}>
              <div className="formRow">
                <div className="formGroup">
                  <label htmlFor="titulo">Título *</label>
                  <input
                    type="text"
                    id="titulo"
                    value={newObjective.titulo}
                    onChange={(e) => setNewObjective({...newObjective, titulo: e.target.value})}
                    placeholder="Ingresa el título del objetivo"
                    required
                  />
                </div>
                <div className="formGroup">
                  <label htmlFor="priority">Prioridad</label>
                  <select
                    id="priority"
                    value={newObjective.priority}
                    onChange={(e) => setNewObjective({...newObjective, priority: e.target.value})}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>
              <div className="formGroup">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  value={newObjective.description}
                  onChange={(e) => setNewObjective({...newObjective, description: e.target.value})}
                  placeholder="Describe el objetivo (opcional)"
                  rows="3"
                />
              </div>
              <div className="formActions">
                <button type="submit" className="saveButton">Guardar</button>
               <button type="button" className="cancelButton" onClick={() => {
                setShowAddForm(false);
                clearObjective();
                  }}> Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de objetivos */}
        <div className="todoTable">
          <div className="tableRow tableHeader">
            <div className="tableCell">Título</div>
            <div className="tableCell">Descripción</div>
            <div className="tableCell">Prioridad</div>
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
                  {objective.description || 'Sin descripción'}
                </div>
                <div className="tableCell">
                  <span 
                    className="priorityBadge" 
                    style={{ backgroundColor: getPriorityColor(objective.priority) }}
                  >
                    {objective.priority === 'Alta' ? 'Alta' : 
                     objective.priority === 'Media' ? 'Media' : 'Baja'}
                  </span>
                </div>
                <div className="tableCell">
                  <button className="actionButton editButton">
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

    </div>
  );
};

export default Objectives;