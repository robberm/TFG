import React, { use, useEffect, useState, useRef } from 'react';
import "./css/PieChart.css";
import { useError } from "./components/ErrorContext";


const COLORS = {
  completed: '#4caf50',
  inProgress: '#ff9800',
  pending: '#e91e63',
  other: '#2383e2'
};

export default function PieChart() {
  const [objectives, setObjectives] = useState([]);
  const { setErrorMessage } = useError();
  const pieRef = useRef(null);

  useEffect(() => {
    const getObjectives = async function () {
      try {
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
        if (!response.ok) {
          throw new Error("Failed to fetch objectives" + response.status);
        }
        const data = await response.json();
        setObjectives(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error.message);
        setObjectives([]);
      }
    };

    getObjectives();
  }, []);


/**
 * Funcion para matchear los objetivos por color correctamente
 */
  const normalizeStatus = (s) => {
    if (!s) return "other";
    const str = String(s).toLowerCase().trim();
    if (str.includes("complete") || str === "done") return "completed";
    if (
      str.includes("progress") ||
      str.includes("inprogress") ||
      str.includes("doing")
    )
      return "inProgress";
    if (str.includes("pend")) return "pending";
    return "pending";
  };

  //Time de dibujar el chart. Agrupamos objetivos por estado y contamos
  const counts = objectives.reduce((acc, obj) => {
    const k = normalizeStatus(obj.status);
    acc[k] = (acc[k] || 0) + 1; //incrementa el contador
    return acc;
  }, {});

  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;

  /**
   * Aqui decimos que por cada key, se asigna un valor, un porcentaje y un color
   * Object.keys(counts) -> ["completed","inProgress","pending"]
   */
  // 
  const slices = Object.keys(counts).map((key) => ({
    //.map() itera el array y quiere decir que por cada clave hace => { }
    key,
    value: counts[key],
    percent: counts[key] / total,
    color: COLORS[key] || COLORS.other,
  }));

  let start = 0; //variable para el angulo inicial
  /**
   * Recorre cada segmento de slices para calcular los angulos inicial y final
   *
   */
  const stops = slices
    .map((s) => {
      const end = start + s.percent * 360; //calcula el angulo final
      const seg = `${s.color} ${start}deg ${end}deg`; //crea el segmento de gradiente
      start = end; //actualiza el angulo inicial para la siguiente iteracion
      return seg;
    })
    .join(", "); // une todas las cadenas con comas para formar la lista de stops que se pasará a conic-gradient(...).

  const gradient = `conic-gradient(${stops})`; // los ` permiten insertar variables dentro de cadenas de texto
  const completedPercent = Math.round(((counts.completed || 0) / total) * 100);

  useEffect(() => {
    if (pieRef.current) {
      pieRef.current.style.background = gradient;
    }
  }, [gradient]);

  if (!objectives || objectives.length === 0) return <div>No objectives</div>;

  return (
    <div className="chartContainer">
      <div className="pieChart" ref={pieRef}>
        <div className="pieCenter">
          <div className="piePercent">{completedPercent}%</div>
          <div className="pieLabel">completado</div>
        </div>
      </div>

      <div className="chartLegend">
        {slices.map((s) => (
          <div key={s.key} className="legendItem">
            <span
              className="legendColor"
              style={{ backgroundColor: s.color }}
            ></span>
            <span className="legendText">
              {" "}
              {s.key} ({Math.round(s.percent * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


 

