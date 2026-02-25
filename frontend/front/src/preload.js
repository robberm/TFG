const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onBlockStatus: (callback) => ipcRenderer.on('block-status', callback),
  startBlock: () => ipcRenderer.send('start-block'),
  endBlock: () => ipcRenderer.send('end-block')
});