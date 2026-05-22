const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

const layout = require("./pet-layout.json");

const PET_DISPLAY_WIDTH = layout.displayWidth;
const JUMP_HEADROOM = layout.jumpHeadroom;
const WINDOW_SIDE_MARGIN = layout.windowSideMargin;

function maxPoseDisplayHeight() {
  return Math.max(
    ...Object.values(layout.poses).map(
      (box) => Math.round((PET_DISPLAY_WIDTH * box.h) / box.w)
    )
  );
}

/** macOS Retina / 小号透明窗口在旧版 Electron + Chromium 上会整窗白屏或不绘制；面积略放大并升级 Electron（≥35.1.3）可改善。 */
const WINDOW_WIDTH = PET_DISPLAY_WIDTH + WINDOW_SIDE_MARGIN;
const WINDOW_HEIGHT = maxPoseDisplayHeight() + JUMP_HEADROOM;
const WINDOW_MARGIN = 8;
const ACTION_MENU_WIDTH = 140;
const ACTION_MENU_HEIGHT = Math.round(PET_DISPLAY_WIDTH / 2);

let mainWindow = null;
let actionMenuWindow = null;
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

function closeActionMenu() {
  if (actionMenuWindow && !actionMenuWindow.isDestroyed()) {
    actionMenuWindow.close();
  }
  actionMenuWindow = null;
}

function getActionMenuPosition(payload) {
  const point = {
    x: Math.round(payload?.screenX ?? 0),
    y: Math.round(payload?.screenY ?? 0),
  };
  const display = screen.getDisplayNearestPoint(point);
  const { workArea } = display;

  return {
    x: clamp(point.x + 8, workArea.x, workArea.x + workArea.width - ACTION_MENU_WIDTH),
    y: clamp(point.y + 8, workArea.y, workArea.y + workArea.height - ACTION_MENU_HEIGHT),
  };
}

function createActionMenu(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  closeActionMenu();

  const position = getActionMenuPosition(payload);
  actionMenuWindow = new BrowserWindow({
    width: ACTION_MENU_WIDTH,
    height: ACTION_MENU_HEIGHT,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  actionMenuWindow.setAlwaysOnTop(true, "screen-saver");
  actionMenuWindow.loadFile(path.join(__dirname, "action-menu.html"));
  actionMenuWindow.on("blur", () => closeActionMenu());
  actionMenuWindow.on("closed", () => {
    actionMenuWindow = null;
  });
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
  mainWindow.on("closed", () => {
    mainWindow = null;
    closeActionMenu();
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

ipcMain.on("pet-show-menu", (event, payload) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return;
  }

  createActionMenu(payload);
});

ipcMain.on("pet-menu-select", (event, pose) => {
  const validPoses = ["bubble-list", "haha", "xuanzhuan", "flower-list", "sing"];
  if (mainWindow && !mainWindow.isDestroyed() && validPoses.includes(pose)) {
    mainWindow.webContents.send("pet-change-pose", pose);
  }
  closeActionMenu();
});

ipcMain.on("pet-menu-close", () => {
  closeActionMenu();
});

ipcMain.on("pet-menu-close-pet", () => {
  closeActionMenu();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});
