import React, { useState } from 'react';
import { useEffect } from 'react';
import './css/Home.css';
import { useError } from './components/ErrorContext';

const Home = () => {
  const[objectives, setObjectives] = useState([]);
  const { setErrorMessage } = useError();

  const filterObjectives = async function(){
    // tu código
  }

  

  return (
    <>
      {/* Título principal personal adecuado al usuario */}
      <div className="personalHeader">
        <h1>Nice to see you, {localStorage.getItem("username")}</h1>
      </div>
      
      {/* Header del dashboard */}
      <div className="dashboardHeader">
        <h1>Dashboard </h1>
      </div>

      {/* Sección del gráfico circular */}
      <div className="chartSection">
        <div className="chartContainer">
          <div className="pieChart">
            {/* El gráfico se crea con conic-gradient en CSS */}
          </div>
        </div>
        <p className="chartLabel">Goals, Jiras, etc</p>
      </div>

      {/* Sección To-do / Done */}
    </>
  );
};

export default Home;