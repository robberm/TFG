import React, { useEffect, useState } from "react";
import "../../css/WindowTitleBar.css";

const WindowTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI
      .isWindowMaximized()
      .then(setIsMaximized)
      .catch(() => {});

    window.electronAPI.onWindowMaximizedChange((maximized) => {
      setIsMaximized(maximized);
    });
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleToggleMaximize = () => {
    window.electronAPI?.toggleMaximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const handleToggleDevTools = () => {
    window.electronAPI?.toggleDevTools();
  };

  const handleDoubleClick = () => {
    window.electronAPI?.toggleMaximizeWindow();
  };

  return (
    <header className="windowTitleBar">
      <div className="windowTitleBarDragArea" onDoubleClick={handleDoubleClick}>
        <div className="windowTitleBarBrand">
          <span className="windowTitleBarDot" />
          <span className="windowTitleBarTitle">TFG App</span>
        </div>
      </div>

      <div className="windowTitleBarActions">
        <button
          type="button"
          className="windowControlButton windowControlButtonTools"
          onClick={handleToggleDevTools}
          aria-label="Abrir o cerrar DevTools"
          title="DevTools"
        >
          {"</>"}
        </button>

        <button
          type="button"
          className="windowControlButton"
          onClick={handleMinimize}
          aria-label="Minimizar"
          title="Minimizar"
        >
          —
        </button>

        <button
          type="button"
          className="windowControlButton"
          onClick={handleToggleMaximize}
          aria-label={isMaximized ? "Restaurar" : "Maximizar"}
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? "❐" : "□"}
        </button>

        <button
          type="button"
          className="windowControlButton windowControlButtonClose"
          onClick={handleClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </header>
  );
};

export default WindowTitleBar;
