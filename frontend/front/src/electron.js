const { app, BrowserWindow } = require('electron');
const path = require("path");


let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadURL('http://localhost:3000'); // Will load React frontend
});