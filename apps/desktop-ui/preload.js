const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("paaDesktop", {
  isDesktop: true,
  moveWindow: (dx, dy) => ipcRenderer.invoke("window-move-by", { dx, dy }),
  setWindowPos: (x, y) => ipcRenderer.invoke("window-set-pos", { x, y }),
  getWindowPos: () => ipcRenderer.invoke("window-get-pos"),
  getScreenBounds: () => ipcRenderer.invoke("get-screen-bounds"),
  setAlwaysOnTop: (always) => ipcRenderer.invoke("set-always-on-top", always),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
});
