const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  pickExportDirectory: () => ipcRenderer.invoke("pick-export-directory"),
  exportMarkdownFiles: (payload) => ipcRenderer.invoke("export-markdown-files", payload),
});
