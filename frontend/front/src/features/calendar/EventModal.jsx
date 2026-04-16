import React, { useState, useEffect, useRef } from "react";
import { format, addMinutes, startOfDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import "../../css/EventModal.css";

// Genera opciones de tiempo en incrementos de 15 minutos
const generateTimeOptions = () => {
  const options = [];
  const baseDate = startOfDay(new Date());

  for (let i = 0; i < 96; i++) {
    const time = addMinutes(baseDate, i * 15);
    options.push({
      value: format(time, "HH:mm"),
      label: format(time, "HH:mm"),
    });
  }

  return options;
};

const TIME_OPTIONS = generateTimeOptions();

/**
 * Convierte una fecha del backend a objeto Date de forma estable.
 * Soporta correctamente LocalDateTime sin zona horaria y fechas ISO con zona.
 *
 * @param {string|Date} value fecha recibida del backend
 * @returns {Date} fecha parseada
 */
const parseCalendarDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value !== "string") {
    return new Date(value);
  }

  const localDateTimeRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,9}))?$/;

  const match = value.match(localDateTimeRegex);

  if (match) {
    const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
      match;

    const milliseconds = Number(fraction.slice(0, 3).padEnd(3, "0"));

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds,
    );
  }

  return parseISO(value);
};

const TimeSelector = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const selectedOptionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && selectedOptionRef.current && optionsRef.current) {
      selectedOptionRef.current.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  const filteredOptions = TIME_OPTIONS.filter((opt) =>
    opt.label.includes(search),
  );

  const handleSelect = (timeValue) => {
    onChange(timeValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="time-selector" ref={dropdownRef}>
      <label className="time-selector-label">{label}</label>
      <div
        className={`time-selector-input ${isOpen ? "active" : ""}`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className="time-value">{value || "00:00"}</span>
        <svg
          className="time-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      </div>

      {isOpen && (
        <div className="time-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="time-search"
            placeholder="Buscar hora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="time-options" ref={optionsRef}>
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                ref={value === opt.value ? selectedOptionRef : null}
                className={`time-option ${value === opt.value ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const EventModal = ({
  event,
  selectedDate,
  onClose,
  onSave,
  onDelete,
  isAdmin = false,
  managedUsers = [],
  defaultManagedUserId = null,
}) => {
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    category: "",
    isAllDay: false,
    targetUserId: "",
    targetUserIds: [],
    assignmentMode: "single",
  });
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (event) {
      const startDate = parseCalendarDate(event.startTime);
      const endDate = parseCalendarDate(event.endTime);

      setFormData({
        id: event.id,
        title: event.title || "",
        description: event.description || "",
        date: format(startDate, "yyyy-MM-dd"),
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        location: event.location || "",
        category: event.category || "",
        isAllDay: event.isAllDay || false,
        targetUserId: defaultManagedUserId ?? "",
        targetUserIds: defaultManagedUserId != null ? [String(defaultManagedUserId)] : [],
        assignmentMode: "single",
      });
      setReminderMinutesBefore(event.reminderMinutesBefore ?? null);
      setShowMoreOptions(true);
    } else if (selectedDate) {
      const startDateTime = new Date(selectedDate);
      const roundedMinutes = Math.ceil(startDateTime.getMinutes() / 15) * 15;
      startDateTime.setMinutes(roundedMinutes, 0, 0);

      const endDateTime = addMinutes(startDateTime, 60);

      setFormData({
        id: null,
        title: "",
        description: "",
        date: format(startDateTime, "yyyy-MM-dd"),
        startTime: format(startDateTime, "HH:mm"),
        endTime: format(endDateTime, "HH:mm"),
        location: "",
        category: "",
        isAllDay: false,
        targetUserId: defaultManagedUserId ?? "",
        targetUserIds: defaultManagedUserId != null ? [String(defaultManagedUserId)] : [],
        assignmentMode: "single",
      });
      setReminderMinutesBefore(null);
      setShowMoreOptions(false);
    }

    setTimeout(() => titleInputRef.current?.focus(), 100);
  }, [defaultManagedUserId, event, selectedDate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8080/events/categories");
        if (!response.ok) throw new Error("Error fetching categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories, formData.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleTimeChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTargetSelection = (value) => {
    setFormData((prev) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();


    const startDateTime = `${formData.date}T${formData.startTime}`;
    const endDateTime = `${formData.date}T${formData.endTime}`;

    const eventData = {
      id: formData.id,
      title: formData.title,
      description: formData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      location: formData.location,
      category: formData.category,
      isAllDay: formData.isAllDay,
      reminderMinutesBefore,
      targetUserId:
        isAdmin && formData.assignmentMode === "single" && formData.targetUserId
          ? Number(formData.targetUserId)
          : null,
      targetUserIds:
        isAdmin && formData.assignmentMode === "multiple"
          ? formData.targetUserIds
                            .map((value) => Number(value))
          : null,
      assignToAllUsers: isAdmin && formData.assignmentMode === "all",
    };

    onSave(eventData);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      onDelete(formData.id);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      reunion: "#6264a7",
      personal: "#78b6c8",
      perfil: "#f48942",
    };
    return colors[cat?.toLowerCase()] || "#6264a7";
  };

  const formatDisplayDate = () => {
    if (!formData.date) return "";
    const date = new Date(`${formData.date}T00:00:00`);
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  return (
    <div className="gcal-modal-overlay" onClick={onClose}>
      <div className="gcal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gcal-modal-header">
          <button className="gcal-close-btn" onClick={onClose} type="button">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gcal-form">
          <div className="gcal-title-section">
            {isAdmin && (
              <div className="gcal-admin-assignment">
                <select
                  name="assignmentMode"
                  className="gcal-input"
                  value={formData.assignmentMode}
                  onChange={handleChange}
                >
                  <option value="single">Usuario</option>
                  <option value="multiple">Varios usuarios</option>
                  <option value="all">Todos (organización)</option>
                </select>

                {formData.assignmentMode === "single" && (
                  <select
                    name="targetUserId"
                    className="gcal-input"
                    value={formData.targetUserId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona usuario subordinado</option>
                    {managedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                )}

                {formData.assignmentMode === "multiple" && (
                  <div className="gcal-multi-targets">
                    {managedUsers.map((user) => (
                      <label key={user.id}>
                        <input
                          type="checkbox"
                          checked={formData.targetUserIds?.includes(String(user.id))}
                          onChange={() => toggleTargetSelection(user.id)}
                        />
                        {user.username}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              ref={titleInputRef}
              type="text"
              name="title"
              className="gcal-title-input"
              placeholder="Añadir título"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="gcal-datetime-section">
            <div className="gcal-section-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <div className="gcal-datetime-content">
              <div className="gcal-date-row">
                <input
                  type="date"
                  name="date"
                  className="gcal-date-input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <span className="gcal-date-display">{formatDisplayDate()}</span>
              </div>

              {!formData.isAllDay && (
                <div className="gcal-time-row">
                  <TimeSelector
                    label="Inicio"
                    value={formData.startTime}
                    onChange={(val) => handleTimeChange("startTime", val)}
                  />
                  <span className="gcal-time-separator">—</span>
                  <TimeSelector
                    label="Fin"
                    value={formData.endTime}
                    onChange={(val) => handleTimeChange("endTime", val)}
                  />
                </div>
              )}

              <label className="gcal-allday-toggle">
                <input
                  type="checkbox"
                  name="isAllDay"
                  checked={formData.isAllDay}
                  onChange={handleChange}
                />
                <span className="gcal-toggle-slider"></span>
                <span className="gcal-toggle-label">Todo el día</span>
              </label>
            </div>
          </div>

          {!showMoreOptions && (
            <button
              type="button"
              className="gcal-more-options-btn"
              onClick={() => setShowMoreOptions(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Más opciones
            </button>
          )}

          {showMoreOptions && (
            <>
              <div className="gcal-location-section">
                <div className="gcal-section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="location"
                  className="gcal-location-input"
                  placeholder="Añadir ubicación"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="gcal-description-section">
                <div className="gcal-section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="17" y1="10" x2="3" y2="10" />
                    <line x1="21" y1="6" x2="3" y2="6" />
                    <line x1="21" y1="14" x2="3" y2="14" />
                    <line x1="17" y1="18" x2="3" y2="18" />
                  </svg>
                </div>
                <textarea
                  name="description"
                  className="gcal-description-input"
                  placeholder="Añadir descripción"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="formGroup">
                <label>Reminder</label>
                <select
                  value={reminderMinutesBefore ?? ""}
                  onChange={(e) =>
                    setReminderMinutesBefore(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                >
                  <option value="">None</option>
                  <option value="10">10 minutes before</option>
                  <option value="1440">24 hours before</option>
                </select>
              </div>

              <div className="gcal-category-section">
                <div className="gcal-section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="gcal-category-chips">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`gcal-category-chip ${formData.category === cat ? "active" : ""}`}
                      style={{
                        "--chip-color": getCategoryColor(cat),
                      }}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: cat }))
                      }
                    >
                      <span className="gcal-chip-dot"></span>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="gcal-modal-footer">
            {event && (
              <button
                type="button"
                className="gcal-delete-btn"
                onClick={handleDelete}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                </svg>
                Eliminar
              </button>
            )}
            <div className="gcal-footer-right">
              <button
                type="button"
                className="gcal-cancel-btn"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="gcal-save-btn">
                {event ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
