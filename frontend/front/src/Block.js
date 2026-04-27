import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./css/Block.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  addBlockedApp as addBlockedAppApi,
  getBlockedApps as getBlockedAppsApi,
  getFocusState,
  getInstalledApps,
  removeBlockedApp as removeBlockedAppApi,
  resetBlockedApps,
  updateFocusSettings,
} from "./api/blockApi";
import { getApiErrorMessage } from "./api/apiClient";
import { useError } from "./components/ErrorContext";

const bubbleContent =
  "Esta ventana está dedicada a ofrecer herramientas para gestionar un uso más saludable del ordenador, fomentando descansos regulares y ayudándote a mantener el enfoque.";

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const CategoryIcons = { other: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>) };

function Block() {
  const { setErrorMessage } = useError();
  const [blockedApps, setBlockedApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState("add");
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [workDurationMinutes, setWorkDurationMinutes] = useState(20);
  const [breakDurationSeconds, setBreakDurationSeconds] = useState(20);
  const [focusAction, setFocusAction] = useState("NOTIFICATION");
  const [timeUntilNextBlock, setTimeUntilNextBlock] = useState(20 * 60);
  const [isBreakPhase, setIsBreakPhase] = useState(false);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const applyFocusState = useCallback((state) => {
    setFocusModeEnabled(!!state.focusModeEnabled);
    const workSeconds = Number(state.workDurationSeconds || 1200);
    setWorkDurationMinutes(Math.max(0.1, Math.round((workSeconds / 60) * 10) / 10));
    setBreakDurationSeconds(Math.max(1, Number(state.breakDurationSeconds || 20)));
    setFocusAction(state.focusAction || "NOTIFICATION");
    const phase = state.currentPhase || "OFF";
    setIsBreakPhase(phase === "BREAK");
    const phaseEndsAtEpochMs = state.phaseEndsAtEpochMs || 0;
    const remaining = Math.max(0, Math.floor((phaseEndsAtEpochMs - (state.serverTimeEpochMs || Date.now())) / 1000));
    setTimeUntilNextBlock(remaining);
  }, []);

  const normalizedBlockedApps = useMemo(() => blockedApps.map((app) => app.toLowerCase()), [blockedApps]);

  const filteredApplications = installedApps
    .filter((app) => app.blockable)
    .filter((app) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (app.displayName || "").toLowerCase().includes(query) ||
        (app.executableName || "").toLowerCase().includes(query)
      );
    });

  const fetchInstalledApps = useCallback(async () => {
    setIsLoadingApps(true);
    try {
      const apps = await getInstalledApps();
      setInstalledApps(Array.isArray(apps) ? apps : []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo cargar la lista de aplicaciones instaladas"));
    } finally {
      setIsLoadingApps(false);
    }
  }, [setErrorMessage]);

  const fetchBlockedApps = useCallback(async () => {
    try {
      const apps = await getBlockedAppsApi();
      setBlockedApps(Array.isArray(apps) ? apps : []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo cargar la lista de aplicaciones bloqueadas"));
    }
  }, [setErrorMessage]);

  const fetchFocusState = useCallback(async () => {
    try {
      const state = await getFocusState();
      applyFocusState(state);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo obtener el estado de foco"));
    }
  }, [applyFocusState, setErrorMessage]);

  useEffect(() => {
    fetchBlockedApps();
    fetchInstalledApps();
    fetchFocusState();

    const refreshInterval = setInterval(fetchFocusState, 20000);
    return () => clearInterval(refreshInterval);
  }, [fetchBlockedApps, fetchFocusState, fetchInstalledApps]);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        stompClient.subscribe("/topic/focus-state", (message) => {
          try {
            const state = JSON.parse(message.body);
            applyFocusState(state);
          } catch (error) {
            console.error("No se pudo parsear focus-state", error);
          }
        });
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [applyFocusState]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilNextBlock((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveFocusSettings = async (next) => {
    try {
      await updateFocusSettings({
        focusModeEnabled: next.focusModeEnabled,
        workDurationSeconds: Math.max(1, Math.round(Math.max(0.1, Number(next.workDurationMinutes || 0.1)) * 60)),
        breakDurationSeconds: Math.max(1, next.breakDurationSeconds),
        focusAction: next.focusAction,
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudieron guardar los ajustes de foco"));
    }
  };

  const addBlockedApp = async (application) => {
    const executableName = typeof application === "string" ? application : application?.executableName || "";
    if (!executableName) {
      setErrorMessage("No se puede bloquear esta aplicación porque no tiene ejecutable principal resuelto");
      return;
    }
    if (normalizedBlockedApps.includes(executableName.toLowerCase())) {
      setErrorMessage("Esta aplicación ya está en la lista de bloqueadas");
      return;
    }
    try {
      await addBlockedAppApi(executableName);
      setSearchQuery("");
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      await fetchBlockedApps();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo agregar la aplicación"));
    }
  };

  const removeBlockedApp = async (appName) => {
    try {
      await removeBlockedAppApi(appName);
      await fetchBlockedApps();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "No se pudo eliminar la aplicación"));
    }
  };

  const resetAppList = async () => {
    try {
      await resetBlockedApps();
      await fetchBlockedApps();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Error al resetear la lista"));
    }
  };

  const getBlockedAppInfo = (appName) => installedApps.find((app) => (app.executableName || "").toLowerCase() === appName.toLowerCase()) || {
    executableName: appName,
    displayName: appName.replace(/\.exe$/i, ""),
    iconBase64: null,
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentPhaseDuration = isBreakPhase ? breakDurationSeconds : workDurationMinutes * 60;
  const progressPercentage = currentPhaseDuration > 0
    ? ((currentPhaseDuration - timeUntilNextBlock) / currentPhaseDuration) * 100
    : 0;

  const modeLabel = focusModeEnabled ? "Focus mode" : "Off";

  return (
    <div className="block-container">
      <div className="block-main">
        <header className="block-header">
          <h1 className="block-title with-bubble">
            Time Tracker
            <span className="burbuja-content">{bubbleContent}</span>
          </h1>
        </header>

        <div className="timer-card">
          <div className="timer-progress-ring">
            <svg className={`timer-ring ${isBreakPhase ? "timer-ring-resting" : ""}`} viewBox="0 0 120 120">
              <circle className="timer-ring-bg" cx="60" cy="60" r="54" fill="none" strokeWidth="8" />
              <circle className="timer-ring-progress" cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 54}`} strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`} transform="rotate(-90 60 60)" />
            </svg>
            <div className="timer-display">
              <span className="timer-value">{formatTime(timeUntilNextBlock)}</span>
              <span className="timer-label">{isBreakPhase ? "descansando" : "próximo descanso"}</span>
            </div>
          </div>
          <div className="timer-status">
            {isBreakPhase ? <span className="status-badge status-resting">Descansando</span> : <span className="status-badge status-working">{modeLabel}</span>}
          </div>
        </div>

        <div className="focus-controls">
          <div className="focus-field">
            <label>Modo</label>
            <select
              value={focusModeEnabled ? "FOCUS" : "OFF"}
              onChange={(e) => {
                const enabled = e.target.value === "FOCUS";
                setFocusModeEnabled(enabled);
                saveFocusSettings({ focusModeEnabled: enabled, workDurationMinutes, breakDurationSeconds, focusAction });
              }}
            >
              <option value="FOCUS">Focus mode</option>
              <option value="OFF">Off</option>
            </select>
          </div>
          <div className="focus-field">
            <label>Trabajo (min)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={workDurationMinutes}
              onChange={(e) => setWorkDurationMinutes(Number(e.target.value || 0.1))}
              onBlur={() => saveFocusSettings({ focusModeEnabled, workDurationMinutes, breakDurationSeconds, focusAction })}
            />
          </div>
          <div className="focus-field">
            <label>Descanso (s)</label>
            <input
              type="number"
              min="1"
              value={breakDurationSeconds}
              onChange={(e) => setBreakDurationSeconds(Number(e.target.value || 1))}
              onBlur={() => saveFocusSettings({ focusModeEnabled, workDurationMinutes, breakDurationSeconds, focusAction })}
            />
          </div>
          <div className="focus-field">
            <label>Al terminar</label>
            <select
              value={focusAction}
              onChange={(e) => {
                setFocusAction(e.target.value);
                saveFocusSettings({ focusModeEnabled, workDurationMinutes, breakDurationSeconds, focusAction: e.target.value });
              }}
            >
              <option value="NOTIFICATION">Notificación</option>
              <option value="SCREEN_BLOCK">Block screen</option>
            </select>
          </div>
        </div>

        <div className="block-tabs">
          <button className={`tab-btn ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}><PlusIcon />Añadir</button>
          <button className={`tab-btn ${activeTab === "manage" ? "active" : ""}`} onClick={() => setActiveTab("manage")}><TrashIcon />Gestionar ({blockedApps.length})</button>
        </div>

        <div className="tab-content">
          {activeTab === "add" && (
            <div className="add-section">
              <div className="search-container" ref={dropdownRef}>
                <div className="search-input-wrapper">
                  <span className="search-icon"><SearchIcon /></span>
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(-1); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} placeholder="Buscar aplicación para bloquear..." className="search-input" />
                  {searchQuery && <button className="search-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}><CloseIcon /></button>}
                  <button className="search-refresh" onClick={fetchInstalledApps} disabled={isLoadingApps} title="Actualizar lista de aplicaciones"><RefreshIcon /></button>
                </div>

                {isDropdownOpen && (
                  <div className="search-dropdown">
                    {isLoadingApps ? (
                      <div className="dropdown-loading"><div className="loading-spinner"></div><span>Cargando aplicaciones...</span></div>
                    ) : filteredApplications.length > 0 ? (
                      <ul className="process-list">
                        {filteredApplications.map((application, index) => {
                          const isAlreadyBlocked = normalizedBlockedApps.includes((application.executableName || "").toLowerCase());
                          return (
                            <li key={`${application.displayName}-${application.executableName || index}`} className={`process-item ${index === selectedIndex ? "selected" : ""} ${isAlreadyBlocked ? "already-blocked" : ""}`} onClick={() => !isAlreadyBlocked && addBlockedApp(application)} onMouseEnter={() => setSelectedIndex(index)}>
                              <div className="process-icon">{application.iconBase64 ? <img src={application.iconBase64} alt="" /> : <span className="category-icon">{CategoryIcons.other}</span>}</div>
                              <div className="process-info"><span className="process-name">{application.displayName}</span><span className="process-exe">{application.executableName}</span></div>
                              <span className="process-category cat-other">instalada</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : searchQuery ? (<div className="dropdown-empty"><p>No se encontraron aplicaciones instaladas</p></div>) : (
                      <div className="dropdown-hint"><p>Escribe para buscar entre las aplicaciones instaladas</p></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "manage" && (
            <div className="manage-section">
              {blockedApps.length > 0 ? (
                <>
                  <ul className="blocked-apps-list">
                    {blockedApps.map((app) => {
                      const info = getBlockedAppInfo(app);
                      return (
                        <li key={app} className="blocked-app-item">
                          <div className="blocked-app-icon">{info.iconBase64 ? <img src={info.iconBase64} alt="" /> : <span className="category-icon">{CategoryIcons.other}</span>}</div>
                          <div className="blocked-app-info"><span className="blocked-app-name">{info.displayName}</span><span className="blocked-app-exe">{app}</span></div>
                          <button className="remove-app-btn" onClick={() => removeBlockedApp(app)} title="Eliminar de la lista"><TrashIcon /></button>
                        </li>
                      );
                    })}
                  </ul>
                  <button className="reset-list-btn" onClick={resetAppList}><RefreshIcon />Resetear lista completa</button>
                </>
              ) : (
                <div className="empty-state"><div className="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20" /></svg></div><p>No hay aplicaciones bloqueadas</p><span>Añade aplicaciones desde la pestaña "Añadir"</span></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Block;
