import React from "react";

const CalendarHeader = ({
  dateText,
  viewMode,
  onPrevious,
  onToday,
  onNext,
  onChangeView,
}) => {
  return (
    <div className="calendar-header">
      <div className="navigation">
        <button onClick={onPrevious}>Anterior</button>
        <button onClick={onToday}>Hoy</button>
        <button onClick={onNext}>Siguiente</button>
      </div>

      <div className="current-date">{dateText}</div>

      <div className="view-options">
        <button
          className={viewMode === "day" ? "active" : ""}
          onClick={() => onChangeView("day")}
        >
          Día
        </button>
        <button
          className={viewMode === "week" ? "active" : ""}
          onClick={() => onChangeView("week")}
        >
          Semana
        </button>
        <button
          className={viewMode === "month" ? "active" : ""}
          onClick={() => onChangeView("month")}
        >
          Mes
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
