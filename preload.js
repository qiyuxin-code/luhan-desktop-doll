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
  showMenu(screenX, screenY) {
    ipcRenderer.send("pet-show-menu", { screenX, screenY });
  },
  onPoseChange(callback) {
    const listener = (event, pose) => callback(pose);
    ipcRenderer.on("pet-change-pose", listener);
    return () => {
      ipcRenderer.removeListener("pet-change-pose", listener);
    };
  },
});

contextBridge.exposeInMainWorld("desktopPetMenu", {
  selectPose(pose) {
    ipcRenderer.send("pet-menu-select", pose);
  },
  close() {
    ipcRenderer.send("pet-menu-close");
  },
  closePet() {
    ipcRenderer.send("pet-menu-close-pet");
  },
});
