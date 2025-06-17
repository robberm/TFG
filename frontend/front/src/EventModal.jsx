import React, { useState, useEffect } from 'react';
import './css/EventModal.css';

const EventModal = ({ event, selectedDate, onClose, onSave, onDelete }) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    startTime: selectedDate ? new Date(selectedDate.setHours(9, 0, 0, 0)).toISOString().slice(0, 16) : '',
    endTime: selectedDate ? new Date(selectedDate.setHours(10, 0, 0, 0)).toISOString().slice(0, 16) : '',
    location: '',
    category: 'work',
    isAllDay: false
  });

  useEffect(() => {
    if (event) {
      setEventData({
        ...event,
        startTime: new Date(event.startTime).toISOString().slice(0, 16),
        endTime: new Date(event.endTime).toISOString().slice(0, 16)
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData({
      ...eventData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedEvent = {
      ...eventData,
      id: event?.id,
      startTime: new Date(eventData.startTime).toISOString(),
      endTime: new Date(eventData.endTime).toISOString()
    };
    onSave(formattedEvent);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">
        <div className="event-modal-header">
          <h2>{event ? 'Edit Event' : 'Add Event'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              required
              placeholder="Add a title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              placeholder="Add a description"
              rows="3"
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="isAllDay"
              name="isAllDay"
              checked={eventData.isAllDay}
              onChange={handleChange}
            />
            <label htmlFor="isAllDay">All day</label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start</label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={eventData.startTime}
                onChange={handleChange}
                required
                disabled={eventData.isAllDay}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End</label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={eventData.endTime}
                onChange={handleChange}
                required
                disabled={eventData.isAllDay}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={eventData.location}
              onChange={handleChange}
              placeholder="Add a location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={eventData.category}
              onChange={handleChange}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="important">Important</option>
              <option value="meeting">Meeting</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="modal-actions">
            {event && (
              <button
                type="button"
                className="delete-button"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button type="submit" className="save-button">
              {event ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
