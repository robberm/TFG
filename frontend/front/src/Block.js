import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./css/Block.css";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

//Constantes:
const bubbleContent =
  "Esta ventana está dedicada a ofrecer herramientas para gestionar un uso más saludable del ordenador, fomentando descansos regulares y ayudándote a mantener el enfoque.";

// Iconos SVG como componentes
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Iconos de categorías
const CategoryIcons = {
  browser: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  game: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
    </svg>
  ),
  communication: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  productivity: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  entertainment: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" />
    </svg>
  ),
  system: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  other: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
};

function Block() {
  const [blockedApps, setBlockedApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isBlocked, setIsBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [activeTab, setActiveTab] = useState("add"); // 'add' | 'manage'

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const username = localStorage.getItem("username") || "global";
  const TIMER_STORAGE = window.sessionStorage;
  const STORAGE_KEY = `lastBlockTime_${username}`;

  const [lastBlockTime, setLastBlockTime] = useState(() => {
    const saved = TIMER_STORAGE.getItem(STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;
    const now = Date.now();

    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= now) return parsed;

    TIMER_STORAGE.setItem(STORAGE_KEY, String(now));
    return now;
  });

  const updateLastBlockTime = (timeMs) => {
    setLastBlockTime(timeMs);
    TIMER_STORAGE.setItem(STORAGE_KEY, String(timeMs));
  };

  const [timeUntilNextBlock, setTimeUntilNextBlock] = useState(() => {
    const saved = TIMER_STORAGE.getItem(STORAGE_KEY);
    const base = saved ? Number(saved) : Date.now();
    const validBase = !Number.isNaN(base) && base > 0 ? base : Date.now();
    const elapsed = Math.floor((Date.now() - validBase) / 1000);
    return Math.max(0, 20 * 60 - elapsed);
  });

  const normalizedBlockedApps = useMemo(
    () => blockedApps.map((app) => app.toLowerCase()),
    [blockedApps],
  );

  const filteredApplications = installedApps.filter((app) => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      (app.displayName || "").toLowerCase().includes(query) ||
      (app.executableName || "").toLowerCase().includes(query)
    );
  });

  const fetchInstalledApps = useCallback(async () => {
    setIsLoadingApps(true);

    try {
      const response = await fetch("http://localhost:8080/api/installed-apps");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      const apps = await response.json();
      setInstalledApps(Array.isArray(apps) ? apps : []);
    } catch (error) {
      console.error("Error obteniendo aplicaciones instaladas:", error);
      setErrorMessage("No se pudo cargar la lista de aplicaciones instaladas");
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedApps();
    fetchInstalledApps();

    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe("/topic/block", (message) => {
          console.log("Mensaje recibido:", message.body);

          if (message.body === "BLOCK_SCREEN") {
            window.electronAPI?.startBlock();
            updateLastBlockTime(Date.now());
          }
        });
      },
      onStompError: (frame) => {
        console.error("Error en STOMP", frame);
      },
    });

    stompClient.activate();

    if (window.electronAPI) {
      window.electronAPI.onBlockStatus((event, status) => {
        setIsBlocked(status);
      });
    }

    return () => {
      stompClient.deactivate();
    };
  }, [fetchInstalledApps]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastBlockTime) / 1000);
      const remaining = Math.max(0, 20 * 60 - elapsedSeconds);
      setTimeUntilNextBlock(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBlockTime]);

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

  const fetchBlockedApps = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/blocked-apps");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      const apps = await response.json();
      setBlockedApps(Array.isArray(apps) ? apps : []);
    } catch (error) {
      console.error("Error obteniendo apps bloqueadas:", error);
      setErrorMessage("No se pudo cargar la lista de aplicaciones bloqueadas");
    }
  };

  const addBlockedApp = async (application) => {
    const executableName =
      typeof application === "string"
        ? application
        : application?.executableName || "";

    if (!executableName) {
      setErrorMessage("No se puede bloquear esta aplicación porque no tiene ejecutable principal resuelto");
      return;
    }

    if (normalizedBlockedApps.includes(executableName.toLowerCase())) {
      setErrorMessage("Esta aplicación ya está en la lista de bloqueadas");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/blocked-apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          executableName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      setSearchQuery("");
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      await fetchBlockedApps();
    } catch (error) {
      console.error("Error agregando app bloqueada:", error);
      setErrorMessage("No se pudo agregar la aplicación");
    }
  };

  const removeBlockedApp = async (appName) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/blocked-apps/${encodeURIComponent(appName)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      await fetchBlockedApps();
    } catch (error) {
      console.error("Error eliminando app bloqueada:", error);
      setErrorMessage("No se pudo eliminar la aplicación");
    }
  };

  const resetAppList = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/blocked-apps/reset",
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }

      await fetchBlockedApps();
    } catch (error) {
      console.error("Error reseteando app list", error);
      setErrorMessage("Error al resetear la lista");
    }
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredApplications.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredApplications[selectedIndex]) {
          const selectedApp = filteredApplications[selectedIndex];

          if (selectedApp.blockable) {
            addBlockedApp(selectedApp);
          } else {
            setErrorMessage(
              "Esta aplicación no tiene un ejecutable principal detectable y no se puede bloquear automáticamente",
            );
          }
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);

    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleSearchFocus = () => {
    setIsDropdownOpen(true);
  };

  const getBlockedAppInfo = (appName) => {
    const installedMatch = installedApps.find(
      (app) =>
        (app.executableName || "").toLowerCase() === appName.toLowerCase(),
    );

    if (installedMatch) {
      return installedMatch;
    }

    return {
      executableName: appName,
      displayName: appName.replace(/\.exe$/i, ""),
      iconBase64: null,
      category: "other",
      blockable: true,
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progressPercentage = ((20 * 60 - timeUntilNextBlock) / (20 * 60)) * 100;

  return (
    <div className="block-container">
      {isBlocked && (
        <div className="block-overlay">
          <div className="block-overlay-content">
            <div className="block-overlay-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2>Tiempo de descanso</h2>
            <p>Relájate y descansa la vista</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="error-toast">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            className="error-toast-close"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <div className="block-main">
        <header className="block-header">
          <h1 className="block-title with-bubble">
            Time Tracker
            <span className="burbuja-content">{bubbleContent}</span>
          </h1>
        </header>

        <div className="timer-card">
          <div className="timer-progress-ring">
            <svg className="timer-ring" viewBox="0 0 120 120">
              <circle
                className="timer-ring-bg"
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
              />
              <circle
                className="timer-ring-progress"
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${
                  2 * Math.PI * 54 * (1 - progressPercentage / 100)
                }`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="timer-display">
              <span className="timer-value">
                {formatTime(timeUntilNextBlock)}
              </span>
              <span className="timer-label">próximo descanso</span>
            </div>
          </div>
          <div className="timer-status">
            {isBlocked ? (
              <span className="status-badge status-resting">Descansando</span>
            ) : (
              <span className="status-badge status-working">En actividad</span>
            )}
          </div>
        </div>

        <div className="block-tabs">
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <PlusIcon />
            Añadir
          </button>
          <button
            className={`tab-btn ${activeTab === "manage" ? "active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            <TrashIcon />
            Gestionar ({blockedApps.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "add" && (
            <div className="add-section">
              <div className="search-container" ref={dropdownRef}>
                <div className="search-input-wrapper">
                  <span className="search-icon">
                    <SearchIcon />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar aplicación para bloquear..."
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                    >
                      <CloseIcon />
                    </button>
                  )}
                  <button
                    className="search-refresh"
                    onClick={fetchInstalledApps}
                    disabled={isLoadingApps}
                    title="Actualizar lista de aplicaciones"
                  >
                    <RefreshIcon />
                  </button>
                </div>

                {isDropdownOpen && (
                  <div className="search-dropdown">
                    {isLoadingApps ? (
                      <div className="dropdown-loading">
                        <div className="loading-spinner"></div>
                        <span>Cargando aplicaciones...</span>
                      </div>
                    ) : filteredApplications.length > 0 ? (
                      <ul className="process-list">
                        {filteredApplications.map((application, index) => {
                          const isAlreadyBlocked = normalizedBlockedApps.includes(
                            (application.executableName || "").toLowerCase(),
                          );

                          return (
                            <li
                              key={`${application.displayName}-${application.executableName || index}`}
                              className={`process-item ${
                                index === selectedIndex ? "selected" : ""
                              } ${isAlreadyBlocked ? "already-blocked" : ""} ${
                                !application.blockable ? "already-blocked" : ""
                              }`}
                              onClick={() => {
                                if (!application.blockable) {
                                  setErrorMessage(
                                    "Esta aplicación no tiene un ejecutable principal detectable y no se puede bloquear automáticamente",
                                  );
                                  return;
                                }

                                if (!isAlreadyBlocked) {
                                  addBlockedApp(application);
                                }
                              }}
                              onMouseEnter={() => setSelectedIndex(index)}
                            >
                              <div className="process-icon">
                                {application.iconBase64 ? (
                                  <img src={application.iconBase64} alt="" />
                                ) : (
                                  <span className="category-icon">
                                    {CategoryIcons.other}
                                  </span>
                                )}
                              </div>
                              <div className="process-info">
                                <span className="process-name">
                                  {application.displayName}
                                </span>
                                <span className="process-exe">
                                  {application.executableName ||
                                    "Ejecutable no resuelto"}
                                </span>
                              </div>
                              <span className="process-category cat-other">
                                {application.blockable ? "instalada" : "manual"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : searchQuery ? (
                      <div className="dropdown-empty">
                        <p>No se encontraron aplicaciones instaladas</p>
                      </div>
                    ) : (
                      <div className="dropdown-hint">
                        <p>Escribe para buscar entre las aplicaciones instaladas</p>
                      </div>
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
                          <div className="blocked-app-icon">
                            {info.iconBase64 ? (
                              <img src={info.iconBase64} alt="" />
                            ) : (
                              <span className="category-icon">
                                {CategoryIcons.other}
                              </span>
                            )}
                          </div>
                          <div className="blocked-app-info">
                            <span className="blocked-app-name">
                              {info.displayName}
                            </span>
                            <span className="blocked-app-exe">{app}</span>
                          </div>
                          <button
                            className="remove-app-btn"
                            onClick={() => removeBlockedApp(app)}
                            title="Eliminar de la lista"
                          >
                            <TrashIcon />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button className="reset-list-btn" onClick={resetAppList}>
                    <RefreshIcon />
                    Resetear lista completa
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </div>
                  <p>No hay aplicaciones bloqueadas</p>
                  <span>Añade aplicaciones desde la pestaña "Añadir"</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Block;