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
    "powershell -ExecutionPolicy Bypass -File C:\\TFGrmg\\TFG\\tools\\blockScreen.ps1"
  );

  // Comprobar y cerrar Block Windows después de 21 segundos
  setTimeout(() => {
    if (blockWindow) {
      blockWindow.close();
      blockWindow = null;
    }
  }, 21000);
}

app.whenReady().then(createWindow); //waiting for electron to be init :)

//cerrar todas las ventanas , sale de la app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
//preload.js manda un mensaje ipc mediante ipcRenderer y aqui lo reciben para crear el block Window
ipcMain.on("start-block", createBlockWindow);
ipcMain.on("end-block", () => {
  if (blockWindow) blockWindow.close();
});
