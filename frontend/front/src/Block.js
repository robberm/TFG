import React, { useState, useEffect } from "react";
import "./css/Block.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function Block() {
  const [blockedApps, setBlockedApps] = useState([]);
  const [newApp, setNewApp] = useState("");
  const [deleteApp, setDeleteApp] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastBlockTime, setLastBlockTime] = useState(() => {
    const saved = localStorage.getItem("lastBlockTime");
    if (saved) {
      return Number(saved);
    }

    const now = Date.now();
    localStorage.setItem("lastBlockTime", String(now)); 
    return now;
  });

  const updateLastBlockTime = (timeMs) => {
    setLastBlockTime(timeMs);
    localStorage.setItem("lastBlockTime", String(timeMs));
  };


  const [timeUntilNextBlock, setTimeUntilNextBlock] = useState(() => {
    const saved = localStorage.getItem("lastBlockTime");
    const base = saved ? Number(saved) : Date.now();
    const elapsed = Math.floor((Date.now() - base) / 1000);
    return Math.max(0, 20 * 60 - elapsed);
  }); // secs

  useEffect(() => {
    fetchBlockedApps();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Conectado al WebSocket");

        stompClient.subscribe("/topic/block", (message) => {
          console.log("Mensaje recibido:", message.body);

          if (message.body === "BLOCK_SCREEN") {
            window.electronAPI.startBlock();
            updateLastBlockTime(Date.now());
          }
        });
      },
      onStompError: (frame) => {
        console.error(" Error en STOMP", frame);
      },
    });

    stompClient.activate();

    // Escuchar eventos desde Electron a través de preload.js
    if (window.electronAPI) {
      window.electronAPI.onBlockStatus((event, status) => {
        setIsBlocked(status);
      });
    }

    return () => {
      stompClient.deactivate();
    };
  }, []);

  //¿Para que sirven los useEffect Rob? Pues es un código que se ejecuta según su dependencia []. Si esta vacio, 1 vez. Si tiene algo, según surja algún cambio en ese algo.
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastBlockTime) / 1000);
      const remaining = Math.max(0, 20 * 60 - elapsedSeconds); // 20 min
      setTimeUntilNextBlock(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBlockTime]);

  const fetchBlockedApps = async function fetchBlockedApps() {
    const response = await fetch("http://localhost:8080/api/blocked-apps");
    const apps = await response.json();
    setBlockedApps(apps);
  };

  const addBlockedApp = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/blocked-apps", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: newApp, // sin stringify
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      setNewApp("");
      fetchBlockedApps();
    } catch (error) {
      console.error("Error agregando app bloqueada:", error);
      setErrorMessage("Ups... no se pudo eliminar la app. Revisá la consola");
    }
  };

  const removeBlockedApp = async function removeApp(appName) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/blocked-apps/${appName}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      setDeleteApp(""); //corrige el estado de entrada una vez interactuado
      fetchBlockedApps(); // actualiza la lista
    } catch (error) {
      console.error("Error eliminando app bloqueada:", error);
      setErrorMessage("Ups... no se pudo eliminar la app. Revisá la consola");
    }
  };

  const resetApplist = async function resetAppList() {
    try {
      const response = await fetch(
        "http://localhost:8080/api/blocked-apps/reset",
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      fetchBlockedApps(); //actualizo lista visualmente
    } catch (error) {
      console.error("Error reseteando app list", error);
      setErrorMessage("Error al tratar de resetear.");
    }
  };

  /*const gameModeOn = async function(){
 
  try{

  }catch(error){
    console.error('Fallon boton gamemode', error);
    setErrorMessage('No se pudo cambiar al gameMode.');
  }

  }*/

  return (
    <>
    <div style = {{display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: "100%", gap: "1.5rem"} }>

      {isBlocked && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "black",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontSize: "2rem",
          }}
        >
          Pantalla bloqueada. Tómate un descanso...
        </div>
      )}
      <div className="app">
        {errorMessage && (
          <div className="error-box">
            {errorMessage}
            <button
              className="error-close-button"
              onClick={() => setErrorMessage("")}
              aria-label="Cerrar error"
            >
              &times;
            </button>
          </div>
        )}
        <h1>Atomic tracker</h1>

        <div className="section">
          <h2>Aplicaciones Bloqueadas</h2>
          <h3>Add an app</h3>
          <div className="add-app">
            <input
              type="text"
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              placeholder="Ej. chrome.exe"
            />
            <button onClick={addBlockedApp}>Añadir</button>
          </div>
          <h3>Remove an app</h3>
          <div className="delete-app">
            <input
              type="text"
              value={deleteApp}
              onChange={(e) => setDeleteApp(e.target.value)}
              placeholder="Ej. chrome.exe"
            />
            <button onClick={() => removeBlockedApp(deleteApp)}>Borrar</button>
          </div>

          <h3>Reset list</h3>
          <div className="reset-applist">
            <button onClick={() => resetApplist()}>Reset</button>
          </div>

          <h4>App list</h4>
          <ul className="app-list">
            {blockedApps.map((app, index) => (
              <li key={index}>{app}</li>
            ))}
          </ul>
        </div>

        <div className="status">
          {isBlocked && <p>¡Pantalla bloqueada! Tómate un descanso.</p>}
        </div>

        </div>



      <div className="timer-container">
      <h3 className="timer-title">Estado</h3>
      {isBlocked ? (
        <div className="status-blocked">
          Descansando...
        </div>
      ) : (
        <div className="status-active">
          <div className="next-block-label">Próximo bloqueo en:</div>
          <div className="timer-display">
            {Math.floor(timeUntilNextBlock / 60)}m {timeUntilNextBlock % 60}s
          </div>
        </div>
      )}
    </div>


      
      </div>
    </>
  );
}

export default Block;
