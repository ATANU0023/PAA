const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const winWidth = 260;
  const winHeight = 220;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 50,
    y: height - winHeight,
    transparent: true,
    backgroundColor: "#00000000",
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const targetUrl = "http://localhost:3001?mode=widget";
  const outPath = path.join(__dirname, "out", "index.html");

  function loadApp() {
    const fs = require("fs");
    mainWindow.loadURL(targetUrl).catch((err) => {
      if (fs.existsSync(outPath)) {
        mainWindow.loadFile(outPath, { query: { mode: "widget" } });
      } else {
        console.log("Waiting for Next.js dev server at http://localhost:3001...", err.message);
        setTimeout(loadApp, 1500);
      }
    });
  }

  loadApp();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers for autonomous desktop roaming & interaction
ipcMain.handle("window-move-by", async (_event, { dx, dy }) => {
  if (!mainWindow) return;
  const [currentX, currentY] = mainWindow.getPosition();
  mainWindow.setPosition(Math.round(currentX + dx), Math.round(currentY + dy));
  return mainWindow.getPosition();
});

ipcMain.handle("window-set-pos", async (_event, { x, y }) => {
  if (!mainWindow) return;
  mainWindow.setPosition(Math.round(x), Math.round(y));
  return mainWindow.getPosition();
});

ipcMain.handle("window-get-pos", async () => {
  if (!mainWindow) return [0, 0];
  return mainWindow.getPosition();
});

ipcMain.handle("get-screen-bounds", async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.workAreaSize;
});

ipcMain.handle("set-always-on-top", async (_event, flag) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(!!flag);
});

ipcMain.handle("minimize-window", async () => {
  if (mainWindow) mainWindow.minimize();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
