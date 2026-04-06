const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen,
} = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow = null;
let blockWindow = null;
let currentWindowTransparent = false;
let isRecreatingWindow = false;

function getRouteToLoad(route = "/") {
  return typeof route === "string" && route.trim() ? route : "/";
}

function loadRenderer(win, route = "/") {
  const finalRoute = getRouteToLoad(route);
  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL(`http://localhost:3000${finalRoute}`);
    return;
  }

  win.loadFile(path.join(__dirname, "..", "build", "index.html")).then(() => {
    if (finalRoute !== "/") {
      win.webContents
        .executeJavaScript(
          `
          (() => {
            const route = ${JSON.stringify(finalRoute)};
            try {
              window.history.replaceState({}, "", route);
              window.dispatchEvent(new PopStateEvent("popstate"));
            } catch (e) {
              console.error(e);
            }
          })();
        `,
        )
        .catch(() => {});
    }
  });
}

function attachWindowEvents(win) {
  win.webContents.on("before-input-event", (event, input) => {
    const wc = win.webContents;

    if (
      input.control &&
      (input.key === "+" || (input.shift && input.key === "="))
    ) {
      event.preventDefault();
      wc.setZoomLevel(wc.getZoomLevel() + 0.5);
    }

    if (input.control && input.key === "-") {
      event.preventDefault();
      wc.setZoomLevel(wc.getZoomLevel() - 0.5);
    }

    if (input.control && input.key === "0") {
      event.preventDefault();
      wc.setZoomLevel(0);
    }
  });

  win.on("maximize", () => {
    if (!win.isDestroyed()) {
      win.webContents.send("window:maximized", true);
    }
  });

  win.on("unmaximize", () => {
    if (!win.isDestroyed()) {
      win.webContents.send("window:maximized", false);
    }
  });
}

function createMainWindow({
  transparentMode = false,
  route = "/",
  bounds = null,
  maximized = false,
  hidden = false,
} = {}) {
  const win = new BrowserWindow({
    width: bounds?.width || 1200,
    height: bounds?.height || 800,
    x: bounds?.x,
    y: bounds?.y,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    frame: false,
    transparent: transparentMode,
    backgroundColor: transparentMode ? "#00000000" : "#111111",
    hasShadow: true,
    thickFrame: true,
    roundedCorners: true,
    resizable: true,
    show: !hidden,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
    },
  });

  attachWindowEvents(win);
  loadRenderer(win, route);

  if (maximized) {
    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) {
        win.maximize();
      }
    });
  }

  return win;
}

function openInitialWindow() {
  mainWindow = createMainWindow({
    transparentMode: false,
    route: "/",
    hidden: false,
  });
}

function recreateMainWindow({ transparentMode, route = "/" }) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    currentWindowTransparent = transparentMode;
    mainWindow = createMainWindow({
      transparentMode,
      route,
      hidden: false,
    });
    return;
  }

  if (isRecreatingWindow) return;
  if (currentWindowTransparent === transparentMode) return;

  isRecreatingWindow = true;

  const oldWindow = mainWindow;
  const wasMaximized = oldWindow.isMaximized();
  const bounds = wasMaximized
    ? oldWindow.getNormalBounds()
    : oldWindow.getBounds();

  const newWindow = createMainWindow({
    transparentMode,
    route,
    bounds,
    maximized: wasMaximized,
    hidden: true,
  });

  const finalizeSwap = () => {
    if (newWindow.isDestroyed()) {
      isRecreatingWindow = false;
      return;
    }

    newWindow.show();
    mainWindow = newWindow;
    currentWindowTransparent = transparentMode;

    if (wasMaximized && !newWindow.isDestroyed()) {
      newWindow.maximize();
    }

    if (!oldWindow.isDestroyed()) {
      oldWindow.destroy();
    }

    isRecreatingWindow = false;
  };

  newWindow.once("ready-to-show", finalizeSwap);

  newWindow.webContents.once("did-fail-load", () => {
    if (!newWindow.isDestroyed()) {
      newWindow.destroy();
    }
    mainWindow = oldWindow;
    isRecreatingWindow = false;
  });
}

function createBlockWindow() {
  blockWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  blockWindow.setAlwaysOnTop(true, "screen-saver");
  blockWindow.setVisibleOnAllWorkspaces(true);
  blockWindow.loadFile(path.join(__dirname, "..", "public", "block.html"));

  exec(
    "powershell -ExecutionPolicy Bypass -File C:\\TFGrmg\\TFG\\tools\\blockScreen.ps1",
  );

  setTimeout(() => {
    if (blockWindow) {
      blockWindow.close();
      blockWindow = null;
    }
  }, 21000);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createReminderWindow(reminder) {
  const display = screen.getPrimaryDisplay();
  const width = 360;
  const height = 220;
  const margin = 18;

  const x = Math.round(
    display.workArea.x + display.workArea.width - width - margin,
  );
  const y = Math.round(
    display.workArea.y + display.workArea.height - height - margin,
  );

  const reminderWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    hasShadow: true,
    focusable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  const title = escapeHtml(reminder?.title || "Evento");
  const description = escapeHtml(reminder?.description || "");
  const location = escapeHtml(reminder?.location || "");
  const isAllDay = !!reminder?.allDay;

  const startTime = reminder?.startTime
    ? new Date(reminder.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reminder</title>
        <style>
          * {
            box-sizing: border-box;
            font-family: "Segoe UI", sans-serif;
          }

          body {
            margin: 0;
            background: transparent;
            overflow: hidden;
          }

          .card {
            width: 100%;
            height: 100%;
            padding: 18px;
            border-radius: 18px;
            background: rgba(22, 22, 22, 0.96);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .eyebrow {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255,255,255,0.65);
          }

          .title {
            font-size: 20px;
            font-weight: 600;
            line-height: 1.2;
          }

          .time,
          .location,
          .description {
            font-size: 13px;
            color: rgba(255,255,255,0.82);
          }

          .actions {
            margin-top: auto;
            display: flex;
            justify-content: flex-end;
          }

          button {
            border: 1px solid rgba(255,255,255,0.14);
            background: transparent;
            color: white;
            border-radius: 999px;
            padding: 8px 14px;
            cursor: pointer;
          }

          button:hover {
            background: rgba(255,255,255,0.08);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="eyebrow">Próximo evento</div>
          <div class="title">${title}</div>
          <div class="time">${isAllDay ? "Todo el día" : `Empieza a las ${startTime}`}</div>
          ${location ? `<div class="location">📍 ${location}</div>` : ""}
          ${description ? `<div class="description">${description}</div>` : ""}
          <div class="actions">
            <button onclick="window.close()">Cerrar</button>
          </div>
        </div>
      </body>
    </html>
  `;

  reminderWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
  );

  reminderWindow.once("ready-to-show", () => {
    if (!reminderWindow.isDestroyed()) {
      reminderWindow.showInactive();
    }
  });

  setTimeout(() => {
    if (!reminderWindow.isDestroyed()) {
      reminderWindow.close();
    }
  }, 12000);
}

app.whenReady().then(() => {
  openInitialWindow();

  globalShortcut.register("F12", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.toggleDevTools();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (isRecreatingWindow) return;
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    openInitialWindow();
  }
});

ipcMain.on("start-block", createBlockWindow);

ipcMain.on("end-block", () => {
  if (blockWindow) blockWindow.close();
});

ipcMain.on("window:minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on("window:toggle-maximize", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on("window:close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.on("window:toggle-devtools", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.toggleDevTools();
  }
});

ipcMain.on("window:set-transparency-mode", (_, payload) => {
  const transparentMode = !!payload?.transparent;
  const route = getRouteToLoad(payload?.route);
  recreateMainWindow({ transparentMode, route });
});

ipcMain.on("show-reminder-window", (_event, reminder) => {
  createReminderWindow(reminder);
});

ipcMain.handle("window:is-maximized", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return mainWindow.isMaximized();
});

ipcMain.handle("window:get-transparency-mode", () => {
  return currentWindowTransparent;
});
