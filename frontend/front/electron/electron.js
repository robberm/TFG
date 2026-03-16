const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
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

ipcMain.handle("window:is-maximized", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return mainWindow.isMaximized();
});

ipcMain.handle("window:get-transparency-mode", () => {
  return currentWindowTransparent;
});
