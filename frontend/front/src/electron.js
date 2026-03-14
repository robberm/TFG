const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow;
let blockWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: null,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, ".", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "build", "index.html"));
  }

  // Zoom con teclado español: Ctrl + + , Ctrl + - , Ctrl + 0
  mainWindow.webContents.on("before-input-event", (event, input) => {
    const wc = mainWindow.webContents;

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
}

function createBlockWindow() {
  blockWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, ".", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  blockWindow.setAlwaysOnTop(true, "screen-saver");
  blockWindow.setVisibleOnAllWorkspaces(true);
  blockWindow.loadFile(path.join(__dirname, ".", "public", "block.html"));

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
  createWindow();
});

// cerrar app cuando se cierran todas las ventanas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// mensajes IPC
ipcMain.on("start-block", createBlockWindow);

ipcMain.on("end-block", () => {
  if (blockWindow) blockWindow.close();
});
