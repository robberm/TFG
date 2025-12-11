import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import "./css/EventModal.css";

const EventModal = ({ event, selectedDate, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "work",
    isAllDay: false,
  });

  useEffect(() => {
    if (event) {
      // Editar evento existente
      setFormData({
        id: event.id,
        title: event.title || "",
        description: event.description || "",
        startTime: format(new Date(event.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(event.endTime), "yyyy-MM-dd'T'HH:mm"),
        location: event.location || "",
        category: event.category || "work",
        isAllDay: event.isAllDay || false,
      });
    } else if (selectedDate) {
      // Nuevo evento
      const startDateTime = new Date(selectedDate);
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(startDateTime.getHours() + 1);

      setFormData({
        id: null,
        title: "",
        description: "",
        startTime: format(startDateTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(endDateTime, "yyyy-MM-dd'T'HH:mm"),
        location: "",
        category: "work",
        isAllDay: false,
      });
    }
  }, [event, selectedDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const eventData = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    onSave(eventData);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      onDelete(formData.id);
    }
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2>{event ? "Editar Evento" : "Nuevo Evento"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Título del evento"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Añadir descripción..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Fecha y hora de inicio *</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Fecha y hora de fin *</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Ubicación</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Añadir ubicación..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="work">Trabajo</option>
              <option value="personal">Personal</option>
              <option value="important">Importante</option>
              <option value="meeting">Reunión</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="isAllDay"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={handleChange}
            />
            <label htmlFor="isAllDay">Evento de todo el día</label>
          </div>

          <div className="modal-actions">
            {event && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            )}
            <button type="submit" className="save-button">
              {event ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
