const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const net = require("net");
const { promisify } = require("util");

let mainWindow = null;
let blockWindow = null;
let backendProcess = null;

let currentWindowTransparent = false;
let isRecreatingWindow = false;
let isQuitting = false;



const execAsync = promisify(exec);
const MYSQL_PORT = 3310;
const DB_TIMEOUT_MS = 90_000;
const DB_POLL_INTERVAL_MS = 1_500;

function getDockerComposePath() {
  const devPath = path.resolve(__dirname, "..", "resources", "docker", "compose.yml");
  const prodPath = path.join(process.resourcesPath, "docker", "compose.yml");

  if (isDevMode() && fs.existsSync(devPath)) {
    return devPath;
  }

  if (fs.existsSync(prodPath)) {
    return prodPath;
  }

  return devPath;
}

async function isDockerAvailable() {
  try {
    await execAsync("docker version", { windowsHide: true });
    return true;
  } catch (_) {
    return false;
  }
}

async function startDockerCompose() {
  const composePath = getDockerComposePath();

  if (!fs.existsSync(composePath)) {
    throw new Error(`No se ha encontrado compose.yml en: ${composePath}`);
  }

  await execAsync(`docker compose -f "${composePath}" up -d`, { windowsHide: true });
}

function canConnectToPort(port, host = "127.0.0.1", timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    const onError = () => {
      socket.destroy();
      resolve(false);
    };

    socket.once("error", onError);
    socket.once("timeout", onError);
    socket.connect(port, host);
  });
}

async function waitForDatabase(timeoutMs = DB_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnectToPort(MYSQL_PORT)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, DB_POLL_INTERVAL_MS));
  }

  throw new Error(`MySQL no disponible en localhost:${MYSQL_PORT} tras ${Math.round(timeoutMs / 1000)}s`);
}

async function ensureDockerDatabaseReady() {
  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    throw new Error("Docker no está disponible. Inicia Docker Desktop y vuelve a abrir la app.");
  }

  const dbReady = await canConnectToPort(MYSQL_PORT);
  if (!dbReady) {
    await startDockerCompose();
  }

  await waitForDatabase();
}
function isDevMode() {
  return !app.isPackaged;
}

function getRouteToLoad(route = "/") {
  return typeof route === "string" && route.trim() ? route : "/";
}

function getAppIconPath() {
  const pngIconPath = path.join(
    __dirname,
    "..",
    "resources",
    "build",
    "icono_final_v2.png",
  );

  return fs.existsSync(pngIconPath) ? pngIconPath : undefined;
}

function getEmbeddedJavaPath() {
  if (process.platform !== "win32") {
    return "java";
  }

  const javaPath = path.join(
    process.resourcesPath,
    "runtime",
    "jre21",
    "bin",
    "java.exe",
  );

  return fs.existsSync(javaPath) ? javaPath : "java";
}

function getBackendJarPath() {
  const jarName = "tfgapp-0.0.1-SNAPSHOT.jar";

  if (isDevMode()) {
    return path.resolve(__dirname, "..", "resources", "backend", jarName);
  }

  return path.join(process.resourcesPath, "backend", jarName);
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  const jarPath = getBackendJarPath();

  if (!fs.existsSync(jarPath)) {
    console.error(`No se ha encontrado el backend en: ${jarPath}`);
    return;
  }

  const javaPath = isDevMode() ? "java" : getEmbeddedJavaPath();

backendProcess = spawn(javaPath, ["-Xms64m", "-Xmx256m", "-jar", jarPath], {
  cwd: path.dirname(jarPath),
  windowsHide: true,
  detached: false,
  stdio: "pipe",
});

  backendProcess.stdout?.on("data", (data) => {
    console.log(`[backend] ${data.toString()}`);
  });

  backendProcess.stderr?.on("data", (data) => {
    console.error(`[backend-error] ${data.toString()}`);
  });

  backendProcess.on("error", (error) => {
    console.error("Error arrancando el backend:", error);
    backendProcess = null;
  });

  backendProcess.on("exit", (code, signal) => {
    if (!isQuitting) {
      console.log(`Backend finalizado. code=${code}, signal=${signal}`);
    }

    backendProcess = null;
  });
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  try {
    backendProcess.kill();
  } catch (error) {
    console.error("Error cerrando el backend:", error);
  } finally {
    backendProcess = null;
  }
}

function loadRenderer(win, route = "/") {
  const finalRoute = getRouteToLoad(route);

  if (isDevMode()) {
    win.loadURL(`http://localhost:3000/#${finalRoute}`);
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
              window.location.hash = route;
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
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      backgroundThrottling: false,
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

function createBlockWindow(payload = {}) {
  const durationSeconds = Math.max(1, Number(payload?.durationSeconds || 20));

  blockWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  blockWindow.setAlwaysOnTop(true, "screen-saver");
  blockWindow.setVisibleOnAllWorkspaces(true);
  blockWindow.loadFile(path.join(__dirname, "..", "public", "block.html"));

  if (process.platform === "win32") {
    const scriptPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "tools",
      "blockScreen.ps1",
    );

    if (fs.existsSync(scriptPath)) {
      exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
    }
  }

  setTimeout(() => {
    if (blockWindow) {
      blockWindow.close();
      blockWindow = null;
    }
  }, durationSeconds * 1000);
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
    icon: getAppIconPath(),
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

app.whenReady().then(async () => {
  try {
    await ensureDockerDatabaseReady();
  } catch (error) {
    console.error("Error preparando Docker/MySQL:", error);
  }

  startBackend();
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

app.on("before-quit", () => {
  isQuitting = true;
  stopBackend();
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

ipcMain.handle("settings:get-auto-start", () => {
  if (process.platform !== "win32" || !app.isPackaged) {
    return false;
  }

  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("settings:set-auto-start", (_event, enabled) => {
  if (process.platform !== "win32" || !app.isPackaged) {
    return false;
  }

  const openAtLogin = !!enabled;
  app.setLoginItemSettings({
    openAtLogin,
    path: process.execPath,
  });

  return app.getLoginItemSettings().openAtLogin;
});
