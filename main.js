const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

/** macOS Retina / 小号透明窗口在旧版 Electron + Chromium 上会整窗白屏或不绘制；面积略放大并升级 Electron（≥35.1.3）可改善。 */
const PET_VIEW = 288;
/** 跳跃动作需要向上留白，否则会被窗口裁切（DOM overflow:visible 也救不了窗口外区域） */
const JUMP_HEADROOM = 80;
const WINDOW_WIDTH = 328;
const WINDOW_HEIGHT = PET_VIEW + JUMP_HEADROOM;
const WINDOW_MARGIN = 8;

let mainWindow = null;
let dragState = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBottomRightPosition() {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    x: Math.round(workArea.x + workArea.width - WINDOW_WIDTH - WINDOW_MARGIN),
    y: Math.round(workArea.y + workArea.height - WINDOW_HEIGHT - WINDOW_MARGIN),
  };
}

function createWindow() {
  const position = getBottomRightPosition();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    minimizable: true,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, "index.html"), {
    query: { mode: "desktop" },
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("pet-drag-start", (event, payload) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !payload) {
    return;
  }

  const bounds = window.getBounds();
  dragState = {
    startScreenX: payload.screenX,
    startScreenY: payload.screenY,
    startWindowX: bounds.x,
    startWindowY: bounds.y,
  };
});

ipcMain.on("pet-drag-move", (event, payload) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !dragState || !payload) {
    return;
  }

  const display = screen.getDisplayNearestPoint({
    x: payload.screenX,
    y: payload.screenY,
  });
  const { workArea } = display;
  const [windowWidth, windowHeight] = window.getSize();

  const deltaX = payload.screenX - dragState.startScreenX;
  const deltaY = payload.screenY - dragState.startScreenY;

  const nextX = clamp(
    dragState.startWindowX + deltaX,
    workArea.x,
    workArea.x + workArea.width - windowWidth
  );
  const nextY = clamp(
    dragState.startWindowY + deltaY,
    workArea.y,
    workArea.y + workArea.height - windowHeight
  );

  window.setPosition(Math.round(nextX), Math.round(nextY));
});

ipcMain.on("pet-drag-end", () => {
  dragState = null;
});

ipcMain.on("pet-close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.close();
  }
});
