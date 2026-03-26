const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    autoHideMenuBar: true,
    title: "XMind to Markdown",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

function sanitizeFileBaseName(fileName) {
  const parsed = path.parse(String(fileName || "mindmap.xmind")).name || "mindmap";
  const sanitized = parsed
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();

  if (!sanitized) return "mindmap";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(sanitized)) {
    return `${sanitized}_file`;
  }
  return sanitized;
}

function resolveUniqueMarkdownPath(directoryPath, baseName) {
  let candidate = path.join(directoryPath, `${baseName}.md`);
  if (!fs.existsSync(candidate)) return candidate;

  let index = 1;
  while (true) {
    candidate = path.join(directoryPath, `${baseName} (${index}).md`);
    if (!fs.existsSync(candidate)) return candidate;
    index += 1;
  }
}

ipcMain.handle("pick-export-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  return {
    canceled: false,
    directoryPath: result.filePaths[0],
  };
});

ipcMain.handle("export-markdown-files", async (_event, payload) => {
  const directoryPath = typeof payload?.directoryPath === "string" ? payload.directoryPath : "";
  const files = Array.isArray(payload?.files) ? payload.files : [];
  const indexFile = payload?.indexFile || null;

  let writtenCount = 0;
  let failedCount = 0;
  const failedFiles = [];
  let indexWritten = false;
  let indexError = "";

  if (!directoryPath) {
    return {
      writtenCount,
      failedCount: files.length,
      failedFiles: files.map((item) => String(item?.fileName || "未命名文件")),
      indexWritten,
      indexError,
    };
  }

  for (const item of files) {
    const fileName = String(item?.fileName || "mindmap.xmind");
    const markdown = String(item?.markdown || "");

    try {
      const baseName = sanitizeFileBaseName(fileName);
      const outputPath = resolveUniqueMarkdownPath(directoryPath, baseName);
      await fs.promises.writeFile(outputPath, markdown, "utf-8");
      writtenCount += 1;
    } catch (error) {
      console.error("[xmind2md] export file failed:", fileName, error);
      failedCount += 1;
      failedFiles.push(fileName);
    }
  }

  if (indexFile && typeof indexFile.markdown === "string") {
    try {
      const indexName = String(indexFile.fileName || "index.md");
      const baseName = sanitizeFileBaseName(indexName);
      const outputPath = resolveUniqueMarkdownPath(directoryPath, baseName);
      await fs.promises.writeFile(outputPath, String(indexFile.markdown || ""), "utf-8");
      indexWritten = true;
    } catch (error) {
      console.error("[xmind2md] export index failed:", error);
      indexError = "index_write_failed";
    }
  }

  return { writtenCount, failedCount, failedFiles, indexWritten, indexError };
});

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
