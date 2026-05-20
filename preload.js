const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  isDesktop: true,
  startDrag(screenX, screenY) {
    ipcRenderer.send("pet-drag-start", { screenX, screenY });
  },
  drag(screenX, screenY) {
    ipcRenderer.send("pet-drag-move", { screenX, screenY });
  },
  endDrag() {
    ipcRenderer.send("pet-drag-end");
  },
  close() {
    ipcRenderer.send("pet-close");
  },
});
