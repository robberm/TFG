const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onBlockStatus: (callback) => ipcRenderer.on("block-status", callback),
  startBlock: () => ipcRenderer.send("start-block"),
  endBlock: () => ipcRenderer.send("end-block"),

  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.send("window:toggle-maximize"),
  closeWindow: () => ipcRenderer.send("window:close"),
  toggleDevTools: () => ipcRenderer.send("window:toggle-devtools"),

  setWindowTransparencyMode: ({ transparent, route }) =>
    ipcRenderer.send("window:set-transparency-mode", { transparent, route }),

  getWindowTransparencyMode: () =>
    ipcRenderer.invoke("window:get-transparency-mode"),

  isWindowMaximized: () => ipcRenderer.invoke("window:is-maximized"),

  showReminderWindow: (reminder) =>
    ipcRenderer.send("show-reminder-window", reminder),

  onWindowMaximizedChange: (callback) => {
    ipcRenderer.removeAllListeners("window:maximized");
    ipcRenderer.on("window:maximized", (_, isMaximized) => {
      callback(isMaximized);
    });
  },
});
