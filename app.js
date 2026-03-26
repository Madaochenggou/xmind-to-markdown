const STORAGE_KEY = "xmind2md.convertOptions.v1";

const DEFAULT_OPTIONS = Object.freeze({
  outputMode: "heading",
  rootMode: "keepRoot",
  spacingMode: "normalSpacing",
  includeNotes: true,
  includeLabels: true,
  includeLinks: true,
  includeMarkers: true,
  exportTemplate: "standard",
  includeFrontMatter: false,
  includeCheckReport: false,
  exportIndexFile: true,
});

const VALID_OUTPUT_MODES = new Set(["heading", "list", "mixed"]);
const VALID_ROOT_MODES = new Set(["keepRoot", "ignoreRoot"]);
const VALID_SPACING_MODES = new Set(["normalSpacing", "compactSpacing"]);
const VALID_EXPORT_TEMPLATES = new Set(["standard", "outline", "document", "test-analysis"]);

const TEMPLATE_RECOMMENDED_OPTIONS = Object.freeze({
  standard: {},
  outline: {
    outputMode: "list",
    rootMode: "ignoreRoot",
    spacingMode: "compactSpacing",
    includeNotes: false,
  },
  document: {
    outputMode: "heading",
    rootMode: "keepRoot",
    spacingMode: "normalSpacing",
    includeNotes: true,
  },
  "test-analysis": {
    outputMode: "mixed",
    rootMode: "keepRoot",
    spacingMode: "normalSpacing",
    includeNotes: true,
  },
});

const CHECK_RULES = Object.freeze({
  maxDepth: 6,
  maxTextLength: 200,
  isolatedAddonThreshold: 3,
});

const FILE_STATUS_LABEL = {
  pending: "待转换",
  converting: "转换中",
  success: "成功",
  error: "失败",
};

const RESULT_VIEW_MODES = new Set(["source", "preview"]);

const MESSAGE = {
  dropDefault: "拖拽 .xmind 文件到此处，或点击添加文件",
  dropActive: "释放以上传",
  emptyFileList: "尚未导入文件",
  skipInvalidFile: "部分文件不是 .xmind，已跳过",
  noConvertibleFile: "没有可转换文件",
  noSuccessFile: "没有可导出的成功文件",
  noSelection: "请选择左侧待查看文件",
  pending: "等待转换，请点击“全部转换”",
  converting: "正在转换，请稍候...",
  success: "转换成功",
  noFile: "请选择一个 .xmind 文件",
  invalidType: "仅支持 .xmind 文件",
  parseFailed: "文件无法解析，请确认文件有效",
  noContent: "未读取到可转换内容",
  convertFailed: "转换失败，请重试",
  copySuccess: "已复制到剪贴板",
  copyFailed: "复制失败，请手动复制",
  downloadDone: "Markdown 文件已下载",
  exportNotSupported: "当前环境不支持目录导出",
  exportPartialFailed: "导出完成，部分文件写入失败",
  exportCanceled: "已取消导出",
  listCleared: "文件列表已清空",
  templateChanged: "模板已切换，可按需应用模板默认设置",
  templateDefaultsApplied: "已应用模板推荐配置",
  checkNoIssues: "检查完成，未发现明显问题",
  checkIssuesFound: "检查完成，发现 {count} 条提醒",
  checkPending: "等待转换后显示检查结果",
  checkConverting: "正在检查中，请稍候...",
  checkError: "转换失败，暂无检查结果",
  checkNoSelection: "请选择左侧待查看文件",
  exportWithIndexFailed: "导出完成，索引文件生成失败",
  fileNameSanitized: "文件名无效，已自动处理",
};

const ERROR_CODE = {
  NO_FILE: "NO_FILE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  PARSE_FAILED: "PARSE_FAILED",
  NO_CONTENT: "NO_CONTENT",
  CONVERT_FAILED: "CONVERT_FAILED",
};

const elements = {
  dropZone: document.getElementById("dropZone"),
  dropHint: document.getElementById("dropHint"),
  fileInput: document.getElementById("xmindFile"),
  fileNotice: document.getElementById("fileNotice"),
  convertAllBtn: document.getElementById("convertAllBtn"),
  exportAllBtn: document.getElementById("exportAllBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  batchSummary: document.getElementById("batchSummary"),
  fileList: document.getElementById("fileList"),
  fileListEmpty: document.getElementById("fileListEmpty"),
  outputMode: document.getElementById("outputMode"),
  rootMode: document.getElementById("rootMode"),
  spacingMode: document.getElementById("spacingMode"),
  exportTemplate: document.getElementById("exportTemplate"),
  applyTemplateDefaultsBtn: document.getElementById("applyTemplateDefaultsBtn"),
  includeNotes: document.getElementById("includeNotes"),
  includeLabels: document.getElementById("includeLabels"),
  includeLinks: document.getElementById("includeLinks"),
  includeMarkers: document.getElementById("includeMarkers"),
  includeFrontMatter: document.getElementById("includeFrontMatter"),
  includeCheckReport: document.getElementById("includeCheckReport"),
  exportIndexFile: document.getElementById("exportIndexFile"),
  currentFileTitle: document.getElementById("currentFileTitle"),
  currentFileState: document.getElementById("currentFileState"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  sourceModeBtn: document.getElementById("sourceModeBtn"),
  previewModeBtn: document.getElementById("previewModeBtn"),
  actionNotice: document.getElementById("actionNotice"),
  statsPanel: document.getElementById("statsPanel"),
  statFileName: document.getElementById("statFileName"),
  statNodeCount: document.getElementById("statNodeCount"),
  statNoteCount: document.getElementById("statNoteCount"),
  statLineCount: document.getElementById("statLineCount"),
  resultPlaceholder: document.getElementById("resultPlaceholder"),
  markdownOutput: document.getElementById("markdownOutput"),
  markdownPreview: document.getElementById("markdownPreview"),
  checkSummary: document.getElementById("checkSummary"),
  checkEmpty: document.getElementById("checkEmpty"),
  checkIssueList: document.getElementById("checkIssueList"),
};

const state = {
  convertOptions: loadConvertOptions(),
  fileItems: [],
  selectedFileId: null,
  resultViewMode: "source",
  isBatchConverting: false,
  dragDepth: 0,
  fileNotice: { text: "", tone: "" },
  actionNoticeTimer: null,
};

let fileCounter = 0;

init();

function init() {
  applyOptionsToForm();
  bindEvents();
  setDropActive(false);
  renderUI();
}

function bindEvents() {
  elements.fileInput.addEventListener("change", handleFileInputChange);

  elements.dropZone.addEventListener("dragenter", handleDragEnter);
  elements.dropZone.addEventListener("dragover", handleDragOver);
  elements.dropZone.addEventListener("dragleave", handleDragLeave);
  elements.dropZone.addEventListener("drop", handleDrop);

  document.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  document.addEventListener("drop", (event) => {
    if (!elements.dropZone.contains(event.target)) {
      event.preventDefault();
    }
  });

  elements.fileList.addEventListener("click", handleFileListClick);

  elements.convertAllBtn.addEventListener("click", () => {
    void handleConvertAll();
  });
  elements.exportAllBtn.addEventListener("click", () => {
    void handleExportAll();
  });
  elements.clearAllBtn.addEventListener("click", handleClearAll);

  elements.copyBtn.addEventListener("click", () => {
    void handleCopyCurrent();
  });
  elements.downloadBtn.addEventListener("click", handleDownloadCurrent);

  elements.sourceModeBtn.addEventListener("click", () => setResultViewMode("source"));
  elements.previewModeBtn.addEventListener("click", () => setResultViewMode("preview"));

  elements.exportTemplate.addEventListener("change", (event) => {
    updateConvertOption("exportTemplate", event.target.value);
    showActionNotice(MESSAGE.templateChanged, "info");
  });
  elements.applyTemplateDefaultsBtn.addEventListener("click", handleApplyTemplateDefaults);

  elements.outputMode.addEventListener("change", (event) => {
    updateConvertOption("outputMode", event.target.value);
  });
  elements.rootMode.addEventListener("change", (event) => {
    updateConvertOption("rootMode", event.target.value);
  });
  elements.spacingMode.addEventListener("change", (event) => {
    updateConvertOption("spacingMode", event.target.value);
  });
  elements.includeNotes.addEventListener("change", (event) => {
    updateConvertOption("includeNotes", event.target.checked);
  });
  elements.includeLabels.addEventListener("change", (event) => {
    updateConvertOption("includeLabels", event.target.checked);
  });
  elements.includeLinks.addEventListener("change", (event) => {
    updateConvertOption("includeLinks", event.target.checked);
  });
  elements.includeMarkers.addEventListener("change", (event) => {
    updateConvertOption("includeMarkers", event.target.checked);
  });
  elements.includeFrontMatter.addEventListener("change", (event) => {
    updateConvertOption("includeFrontMatter", event.target.checked);
  });
  elements.includeCheckReport.addEventListener("change", (event) => {
    updateConvertOption("includeCheckReport", event.target.checked);
  });
  elements.exportIndexFile.addEventListener("change", (event) => {
    updateConvertOption("exportIndexFile", event.target.checked);
  });
}

function handleFileInputChange() {
  const files = Array.from(elements.fileInput.files || []);
  elements.fileInput.value = "";
  if (files.length === 0) return;
  addFiles(files);
}

function handleDragEnter(event) {
  event.preventDefault();
  state.dragDepth += 1;
  setDropActive(true);
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  setDropActive(true);
}

function handleDragLeave(event) {
  event.preventDefault();
  state.dragDepth = Math.max(0, state.dragDepth - 1);
  if (state.dragDepth === 0) {
    setDropActive(false);
  }
}

function handleDrop(event) {
  event.preventDefault();
  state.dragDepth = 0;
  setDropActive(false);
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length === 0) return;
  addFiles(files);
}

function addFiles(files) {
  const validFiles = [];
  let invalidCount = 0;

  for (const file of files) {
    if (isValidXmindFile(file)) {
      validFiles.push(file);
    } else {
      invalidCount += 1;
    }
  }

  if (invalidCount > 0) {
    setFileNotice(MESSAGE.skipInvalidFile, "info");
  } else {
    clearFileNotice();
  }

  if (validFiles.length === 0) {
    renderUI();
    return;
  }

  const nextItems = validFiles.map(createFileItem);
  state.fileItems = state.fileItems.concat(nextItems);

  if (!state.selectedFileId) {
    state.selectedFileId = nextItems[0].id;
  }

  renderUI();
}

function createFileItem(file) {
  fileCounter += 1;
  return {
    id: `file_${Date.now()}_${fileCounter}`,
    file,
    fileName: file.name,
    status: "pending",
    markdown: "",
    stats: undefined,
    errorMessage: "",
    checkIssues: [],
    hasWarnings: false,
  };
}

function handleFileListClick(event) {
  const removeBtn = event.target.closest("[data-action='remove']");
  if (removeBtn) {
    const id = removeBtn.dataset.id;
    if (id) removeFileItem(id);
    return;
  }

  const row = event.target.closest(".file-item[data-id]");
  if (!row) return;
  const id = row.dataset.id;
  if (!id) return;
  selectFileItem(id);
}

function selectFileItem(id) {
  if (!state.fileItems.some((item) => item.id === id)) return;
  state.selectedFileId = id;
  renderUI();
}

function removeFileItem(id) {
  if (state.isBatchConverting) return;

  const index = state.fileItems.findIndex((item) => item.id === id);
  if (index < 0) return;

  const wasSelected = state.selectedFileId === id;
  state.fileItems.splice(index, 1);

  if (wasSelected) {
    const nextSelected = state.fileItems[index] || state.fileItems[index - 1] || null;
    state.selectedFileId = nextSelected ? nextSelected.id : null;
  }

  if (state.fileItems.length === 0) {
    state.selectedFileId = null;
    clearActionNotice();
  }

  renderUI();
}

function handleClearAll() {
  if (state.isBatchConverting) return;
  state.fileItems = [];
  state.selectedFileId = null;
  clearActionNotice();
  setFileNotice(MESSAGE.listCleared, "info");
  renderUI();
}

async function handleConvertAll() {
  if (state.isBatchConverting) return;

  const targets = state.fileItems.filter((item) => item.status === "pending" || item.status === "error");
  if (targets.length === 0) {
    setFileNotice(MESSAGE.noConvertibleFile, "info");
    renderUI();
    return;
  }

  state.isBatchConverting = true;
  clearActionNotice();
  clearFileNotice();
  renderUI();

  const optionsSnapshot = { ...state.convertOptions };

  for (const target of targets) {
    const found = getFileItemById(target.id);
    if (!found) continue;

    patchFileItem(found.id, {
      status: "converting",
      markdown: "",
      stats: undefined,
      errorMessage: "",
      checkIssues: [],
      hasWarnings: false,
    });
    renderUI();

    try {
      const result = await convertXmindToMarkdown(found.file, optionsSnapshot);
      patchFileItem(found.id, {
        status: "success",
        markdown: result.markdown,
        stats: result.stats,
        errorMessage: "",
        checkIssues: result.checkIssues,
        hasWarnings: result.hasWarnings,
      });
    } catch (error) {
      console.error("[xmind2md] convert failed:", error);
      patchFileItem(found.id, {
        status: "error",
        markdown: "",
        stats: undefined,
        errorMessage: mapErrorToUserMessage(error),
        checkIssues: [],
        hasWarnings: false,
      });
    }

    renderUI();
  }

  state.isBatchConverting = false;

  const summary = buildBatchSummary();
  const warningSegment =
    summary.warningFiles > 0 ? `，提醒文件 ${summary.warningFiles}` : "";

  if (summary.error > 0) {
    setFileNotice(`转换完成：成功 ${summary.success}，失败 ${summary.error}${warningSegment}`, "info");
  } else {
    setFileNotice(`转换完成：成功 ${summary.success} 个文件${warningSegment}`, "success");
  }

  renderUI();
}

async function handleCopyCurrent() {
  const current = getSelectedFileItem();
  if (!current || current.status !== "success" || !current.markdown) return;

  try {
    await navigator.clipboard.writeText(current.markdown);
    showActionNotice(MESSAGE.copySuccess, "success");
  } catch (error) {
    console.error("[xmind2md] copy failed:", error);
    showActionNotice(MESSAGE.copyFailed, "error");
  }
}

function handleDownloadCurrent() {
  const current = getSelectedFileItem();
  if (!current || current.status !== "success" || !current.markdown) return;

  const exportedMarkdown = buildExportMarkdown(current, state.convertOptions, {
    generatedAt: new Date().toISOString(),
  });
  const fileNameAdjusted = isFileNameAdjusted(current.fileName);
  const fileBaseName = sanitizeMarkdownBaseName(current.fileName);
  const blob = new Blob([exportedMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileBaseName}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  if (fileNameAdjusted) {
    showActionNotice(`${MESSAGE.downloadDone}（${MESSAGE.fileNameSanitized}）`, "success");
  } else {
    showActionNotice(MESSAGE.downloadDone, "success");
  }
}

async function handleExportAll() {
  if (state.isBatchConverting) return;

  const successItems = state.fileItems.filter((item) => item.status === "success" && item.markdown);
  if (successItems.length === 0) {
    setFileNotice(MESSAGE.noSuccessFile, "info");
    renderUI();
    return;
  }

  if (!canUseElectronExport()) {
    setFileNotice(MESSAGE.exportNotSupported, "error");
    renderUI();
    return;
  }

  try {
    const picked = await window.electronAPI.pickExportDirectory();
    if (!picked || picked.canceled || !picked.directoryPath) {
      setFileNotice(MESSAGE.exportCanceled, "info");
      renderUI();
      return;
    }

    const generatedAt = new Date().toISOString();
    const exportFiles = successItems.map((item) => ({
      fileName: item.fileName,
      markdown: buildExportMarkdown(item, state.convertOptions, { generatedAt }),
    }));

    let indexFile = null;
    if (state.convertOptions.exportIndexFile) {
      const indexMarkdown = buildBatchIndexMarkdown(state.fileItems, generatedAt);
      if (indexMarkdown) {
        indexFile = {
          fileName: "index.md",
          markdown: indexMarkdown,
        };
      }
    }

    const payload = {
      directoryPath: picked.directoryPath,
      files: exportFiles,
      indexFile,
    };

    const result = await window.electronAPI.exportMarkdownFiles(payload);
    const writtenCount = Number(result?.writtenCount || 0);
    const failedCount = Number(result?.failedCount || 0);
    const indexFailed = Boolean(indexFile) && !result?.indexWritten;

    const hasAdjustedName = successItems.some((item) => isFileNameAdjusted(item.fileName));

    if (failedCount > 0 && indexFailed) {
      setFileNotice(
        `已导出 ${writtenCount} 个文件，${failedCount} 个失败文件未导出；索引文件生成失败`,
        "info"
      );
    } else if (failedCount > 0) {
      setFileNotice(`已导出 ${writtenCount} 个文件，${failedCount} 个失败文件未导出`, "info");
    } else if (indexFailed) {
      setFileNotice(MESSAGE.exportWithIndexFailed, "info");
    } else {
      setFileNotice(`已导出 ${writtenCount} 个文件`, "success");
    }

    if (hasAdjustedName) {
      setFileNotice(`${state.fileNotice.text}；${MESSAGE.fileNameSanitized}`, state.fileNotice.tone || "info");
    }
  } catch (error) {
    console.error("[xmind2md] export failed:", error);
    setFileNotice(MESSAGE.exportPartialFailed, "error");
  }

  renderUI();
}

function canUseElectronExport() {
  return Boolean(
    window.electronAPI &&
      typeof window.electronAPI.pickExportDirectory === "function" &&
      typeof window.electronAPI.exportMarkdownFiles === "function"
  );
}

function buildExportMarkdown(item, options, context = {}) {
  const safeOptions = sanitizeConvertOptions(options);
  const generatedAt =
    typeof context.generatedAt === "string" && context.generatedAt ? context.generatedAt : new Date().toISOString();

  const blocks = [];

  if (safeOptions.includeFrontMatter) {
    try {
      blocks.push(buildFrontMatter(item, safeOptions, generatedAt));
    } catch (error) {
      console.warn("[xmind2md] front matter skipped:", error);
    }
  }

  blocks.push(String(item?.markdown || "").trimEnd());

  if (safeOptions.includeCheckReport) {
    try {
      const report = buildCheckReportMarkdown(item?.checkIssues || []);
      if (report) {
        blocks.push(report);
      }
    } catch (error) {
      console.warn("[xmind2md] check report skipped:", error);
    }
  }

  const output = blocks.filter(Boolean).join("\n\n").trimEnd();
  return output ? `${output}\n` : "";
}

function buildFrontMatter(item, options, generatedAt) {
  const title = deriveExportTitle(item);
  const stats = item?.stats || {};

  const rows = [
    "---",
    `title: ${toYamlString(title)}`,
    `template: ${toYamlString(options.exportTemplate || "standard")}`,
    `nodeCount: ${Number(stats.nodeCount || 0)}`,
    `noteCount: ${Number(stats.noteCount || 0)}`,
    `generatedAt: ${toYamlString(generatedAt)}`,
    `sourceFile: ${toYamlString(String(item?.fileName || "mindmap.xmind"))}`,
    "---",
  ];

  return rows.join("\n");
}

function deriveExportTitle(item) {
  const fileName = String(item?.fileName || "");
  const base = fileName.replace(/\.xmind$/i, "").trim();
  return base || "Untitled";
}

function toYamlString(value) {
  return `"${String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')}"`;
}

function buildCheckReportMarkdown(checkIssues) {
  const issues = Array.isArray(checkIssues) ? checkIssues : [];
  if (issues.length === 0) return "";

  const lines = ["## 检查结果"];
  for (const issue of issues) {
    const pathSuffix = issue.nodePath ? `（${issue.nodePath}）` : "";
    lines.push(`- ${issue.severity}：${issue.message}${pathSuffix}`);
  }
  return lines.join("\n");
}

function buildBatchIndexMarkdown(fileItems, generatedAt) {
  const items = Array.isArray(fileItems) ? fileItems : [];
  const successItems = items.filter((item) => item.status === "success");
  const failedItems = items.filter((item) => item.status === "error");
  const warningItems = items.filter((item) => item.hasWarnings);

  const lines = [
    "# 批量导出索引",
    "",
    `- 导出时间：${generatedAt}`,
    `- 文件总数：${items.length}`,
    `- 成功数：${successItems.length}`,
    `- 失败数：${failedItems.length}`,
    `- warning 文件数：${warningItems.length}`,
  ];

  if (successItems.length > 0) {
    lines.push("", "## 成功文件");
    for (const item of successItems) {
      const stats = item.stats || {};
      const warningCount = (item.checkIssues || []).filter((issue) => issue.severity === "warning").length;
      lines.push(
        `- ${item.fileName}（节点 ${Number(stats.nodeCount || 0)}，备注 ${Number(stats.noteCount || 0)}，行数 ${Number(stats.lineCount || 0)}，warning ${warningCount}）`
      );
    }
  }

  if (failedItems.length > 0) {
    lines.push("", "## 失败文件");
    for (const item of failedItems) {
      lines.push(`- ${item.fileName}：${item.errorMessage || MESSAGE.convertFailed}`);
    }
  }

  if (warningItems.length > 0) {
    lines.push("", "## 含提醒文件");
    for (const item of warningItems) {
      const warningCount = (item.checkIssues || []).filter((issue) => issue.severity === "warning").length;
      lines.push(`- ${item.fileName}：${warningCount} 条 warning`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function sanitizeMarkdownBaseName(fileName) {
  const base = String(fileName || "mindmap")
    .replace(/\.xmind$/i, "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
  return base || "mindmap";
}

function isFileNameAdjusted(fileName) {
  return sanitizeMarkdownBaseName(fileName) !== getRawMarkdownBaseName(fileName);
}

function getRawMarkdownBaseName(fileName) {
  const base = String(fileName || "mindmap").replace(/\.xmind$/i, "").trim();
  return base || "mindmap";
}

function setResultViewMode(mode) {
  if (!RESULT_VIEW_MODES.has(mode)) return;
  state.resultViewMode = mode;
  renderUI();
}

function setDropActive(active) {
  elements.dropZone.classList.toggle("drag-active", active);
  elements.dropHint.textContent = active ? MESSAGE.dropActive : MESSAGE.dropDefault;
}

function setFileNotice(text, tone = "") {
  state.fileNotice = { text, tone };
}

function clearFileNotice() {
  state.fileNotice = { text: "", tone: "" };
}

function showActionNotice(text, tone = "") {
  clearActionNoticeTimerOnly();
  elements.actionNotice.textContent = text;
  elements.actionNotice.className = `action-notice ${tone}`.trim();

  state.actionNoticeTimer = setTimeout(() => {
    clearActionNotice();
  }, 1600);
}

function clearActionNoticeTimerOnly() {
  if (state.actionNoticeTimer) {
    clearTimeout(state.actionNoticeTimer);
    state.actionNoticeTimer = null;
  }
}

function clearActionNotice() {
  clearActionNoticeTimerOnly();
  elements.actionNotice.textContent = "";
  elements.actionNotice.className = "action-notice";
}

function updateConvertOption(key, value) {
  state.convertOptions = sanitizeConvertOptions({
    ...state.convertOptions,
    [key]: value,
  });
  saveConvertOptions(state.convertOptions);
  applyOptionsToForm();
  renderUI();
}

function handleApplyTemplateDefaults() {
  const template = state.convertOptions.exportTemplate;
  const patch = TEMPLATE_RECOMMENDED_OPTIONS[template] || {};
  state.convertOptions = sanitizeConvertOptions({
    ...state.convertOptions,
    ...patch,
  });
  saveConvertOptions(state.convertOptions);
  applyOptionsToForm();
  showActionNotice(MESSAGE.templateDefaultsApplied, "success");
  renderUI();
}

function patchFileItem(id, patch) {
  const index = state.fileItems.findIndex((item) => item.id === id);
  if (index < 0) return;
  state.fileItems[index] = {
    ...state.fileItems[index],
    ...patch,
  };
}

function getFileItemById(id) {
  return state.fileItems.find((item) => item.id === id) || null;
}

function getSelectedFileItem() {
  if (!state.selectedFileId) return null;
  return getFileItemById(state.selectedFileId);
}

function buildBatchSummary() {
  const summary = {
    total: state.fileItems.length,
    success: 0,
    error: 0,
    converting: 0,
    pending: 0,
    warningFiles: 0,
  };

  for (const item of state.fileItems) {
    if (item.status === "success") summary.success += 1;
    else if (item.status === "error") summary.error += 1;
    else if (item.status === "converting") summary.converting += 1;
    else summary.pending += 1;

    if (item.hasWarnings) summary.warningFiles += 1;
  }

  return summary;
}

function renderUI() {
  renderFileNotice();
  renderBatchSummary();
  renderFileList();
  renderButtons();
  renderOptionsDisabledState();
  renderCurrentPane();
}

function renderFileNotice() {
  elements.fileNotice.textContent = state.fileNotice.text;
  elements.fileNotice.className = `file-notice ${state.fileNotice.tone}`.trim();
}

function renderBatchSummary() {
  const summary = buildBatchSummary();
  elements.batchSummary.textContent = `总数 ${summary.total} · 成功 ${summary.success} · 失败 ${summary.error} · 转换中 ${summary.converting} · 待转换 ${summary.pending} · 提醒文件 ${summary.warningFiles}`;
}

function renderFileList() {
  if (state.fileItems.length === 0) {
    elements.fileList.innerHTML = "";
    elements.fileListEmpty.hidden = false;
    elements.fileListEmpty.textContent = MESSAGE.emptyFileList;
    return;
  }

  elements.fileListEmpty.hidden = true;

  const rows = state.fileItems.map((item) => {
    const selectedClass = item.id === state.selectedFileId ? "selected" : "";
    const canPreview = item.status === "success" ? "可预览" : "不可预览";
    const issues = Array.isArray(item.checkIssues) ? item.checkIssues : [];
    const warningCount = issues.filter((issue) => issue.severity === "warning").length;
    const warningFlag =
      item.hasWarnings && warningCount > 0
        ? `<span class="warning-flag">提醒 ${warningCount}</span>`
        : "";
    const errorHtml =
      item.status === "error" && item.errorMessage
        ? `<div class="file-error">${escapeHtml(item.errorMessage)}</div>`
        : "";

    return `
      <li class="file-item ${selectedClass}" data-id="${escapeHtml(item.id)}">
        <div class="file-info">
          <div class="file-name">${escapeHtml(item.fileName)}</div>
          <div class="file-meta">
            <span class="status-badge ${escapeHtml(item.status)}">${escapeHtml(FILE_STATUS_LABEL[item.status] || item.status)}</span>
            <span class="preview-flag">${canPreview}</span>
            ${warningFlag}
          </div>
          ${errorHtml}
        </div>
        <button
          class="remove-btn"
          type="button"
          data-action="remove"
          data-id="${escapeHtml(item.id)}"
          ${state.isBatchConverting ? "disabled" : ""}
        >
          移除
        </button>
      </li>
    `;
  });

  elements.fileList.innerHTML = rows.join("");
}

function renderButtons() {
  const summary = buildBatchSummary();
  const hasFiles = summary.total > 0;
  const hasSuccess = summary.success > 0;
  const hasConvertible = summary.pending > 0 || summary.error > 0;
  const current = getSelectedFileItem();
  const currentSuccess = current && current.status === "success" && current.markdown;
  const exportSupported = canUseElectronExport();

  elements.convertAllBtn.disabled = !hasFiles || !hasConvertible || state.isBatchConverting;
  elements.clearAllBtn.disabled = !hasFiles || state.isBatchConverting;
  elements.exportAllBtn.disabled = !hasSuccess || state.isBatchConverting || !exportSupported;

  elements.copyBtn.disabled = !currentSuccess;
  elements.downloadBtn.disabled = !currentSuccess;

  const viewModeEnabled = Boolean(currentSuccess);
  elements.sourceModeBtn.disabled = !viewModeEnabled;
  elements.previewModeBtn.disabled = !viewModeEnabled;
}

function renderOptionsDisabledState() {
  const disabled = state.isBatchConverting;
  elements.outputMode.disabled = disabled;
  elements.rootMode.disabled = disabled;
  elements.spacingMode.disabled = disabled;
  elements.exportTemplate.disabled = disabled;
  elements.applyTemplateDefaultsBtn.disabled = disabled;
  elements.includeNotes.disabled = disabled;
  elements.includeLabels.disabled = disabled;
  elements.includeLinks.disabled = disabled;
  elements.includeMarkers.disabled = disabled;
  elements.includeFrontMatter.disabled = disabled;
  elements.includeCheckReport.disabled = disabled;
  elements.exportIndexFile.disabled = disabled;
  elements.fileInput.disabled = false;
}

function renderCurrentPane() {
  const current = getSelectedFileItem();

  hideResultDisplays();

  if (!current) {
    elements.currentFileTitle.textContent = "当前文件";
    elements.currentFileState.textContent = MESSAGE.noSelection;
    elements.currentFileState.className = "status-text";
    elements.statsPanel.hidden = true;
    showPlaceholder(MESSAGE.noSelection);
    renderCheckIssuesPane(null, "empty");
    updateViewModeButtons();
    return;
  }

  elements.currentFileTitle.textContent = current.fileName;

  if (current.status === "pending") {
    elements.currentFileState.textContent = MESSAGE.pending;
    elements.currentFileState.className = "status-text";
    elements.statsPanel.hidden = true;
    showPlaceholder(MESSAGE.pending);
    renderCheckIssuesPane(current, "pending");
    updateViewModeButtons();
    return;
  }

  if (current.status === "converting") {
    elements.currentFileState.textContent = MESSAGE.converting;
    elements.currentFileState.className = "status-text";
    elements.statsPanel.hidden = true;
    showPlaceholder(MESSAGE.converting);
    renderCheckIssuesPane(current, "converting");
    updateViewModeButtons();
    return;
  }

  if (current.status === "error") {
    elements.currentFileState.textContent = current.errorMessage || MESSAGE.convertFailed;
    elements.currentFileState.className = "status-text error";
    elements.statsPanel.hidden = true;
    showPlaceholder(current.errorMessage || MESSAGE.convertFailed, "error");
    renderCheckIssuesPane(current, "error");
    updateViewModeButtons();
    return;
  }

  elements.currentFileState.textContent = MESSAGE.success;
  elements.currentFileState.className = "status-text success";
  renderStats(current.stats);

  if (state.resultViewMode === "preview") {
    elements.markdownPreview.hidden = false;
    elements.markdownPreview.innerHTML = renderMarkdownPreview(current.markdown);
  } else {
    elements.markdownOutput.hidden = false;
    elements.markdownOutput.value = current.markdown;
  }

  renderCheckIssuesPane(current, "success");
  updateViewModeButtons();
}

function hideResultDisplays() {
  elements.resultPlaceholder.hidden = true;
  elements.markdownOutput.hidden = true;
  elements.markdownPreview.hidden = true;
  elements.markdownPreview.innerHTML = "";
  elements.markdownOutput.value = "";
}

function showPlaceholder(text, tone = "") {
  elements.resultPlaceholder.hidden = false;
  elements.resultPlaceholder.textContent = text;
  elements.resultPlaceholder.className = `result-placeholder ${tone}`.trim();
}

function updateViewModeButtons() {
  elements.sourceModeBtn.classList.toggle("active", state.resultViewMode === "source");
  elements.previewModeBtn.classList.toggle("active", state.resultViewMode === "preview");
}

function renderCheckIssuesPane(current, paneStatus) {
  elements.checkIssueList.innerHTML = "";
  elements.checkIssueList.hidden = true;

  if (!current || paneStatus === "empty") {
    elements.checkSummary.textContent = "暂无检查结果";
    elements.checkEmpty.textContent = MESSAGE.checkNoSelection;
    elements.checkEmpty.hidden = false;
    return;
  }

  if (paneStatus === "pending") {
    elements.checkSummary.textContent = "暂无检查结果";
    elements.checkEmpty.textContent = MESSAGE.checkPending;
    elements.checkEmpty.hidden = false;
    return;
  }

  if (paneStatus === "converting") {
    elements.checkSummary.textContent = "检查中";
    elements.checkEmpty.textContent = MESSAGE.checkConverting;
    elements.checkEmpty.hidden = false;
    return;
  }

  if (paneStatus === "error") {
    elements.checkSummary.textContent = "暂无检查结果";
    elements.checkEmpty.textContent = MESSAGE.checkError;
    elements.checkEmpty.hidden = false;
    return;
  }

  const issues = Array.isArray(current.checkIssues) ? current.checkIssues : [];
  if (issues.length === 0) {
    elements.checkSummary.textContent = MESSAGE.checkNoIssues;
    elements.checkEmpty.textContent = "未发现需要关注的问题";
    elements.checkEmpty.hidden = false;
    return;
  }

  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  elements.checkSummary.textContent = MESSAGE.checkIssuesFound.replace("{count}", String(issues.length));
  elements.checkEmpty.hidden = true;
  elements.checkIssueList.hidden = false;

  elements.checkIssueList.innerHTML = issues
    .map((issue) => {
      const pathHtml = issue.nodePath
        ? `<div class="check-node-path">节点路径：${escapeHtml(issue.nodePath)}</div>`
        : "";
      return `
        <li class="check-issue-item">
          <span class="check-severity ${escapeHtml(issue.severity)}">${escapeHtml(issue.severity)}</span>
          <span class="check-message">${escapeHtml(issue.message)}</span>
          ${pathHtml}
        </li>
      `;
    })
    .join("");

  if (warningCount > 0) {
    elements.checkSummary.textContent += `（warning ${warningCount}）`;
  }
}

function renderStats(stats) {
  if (!stats) {
    elements.statsPanel.hidden = true;
    return;
  }

  elements.statsPanel.hidden = false;
  elements.statFileName.textContent = stats.fileName;
  elements.statNodeCount.textContent = String(stats.nodeCount);
  elements.statNoteCount.textContent = String(stats.noteCount);
  elements.statLineCount.textContent = String(stats.lineCount);
}

function applyOptionsToForm() {
  elements.exportTemplate.value = state.convertOptions.exportTemplate;
  elements.outputMode.value = state.convertOptions.outputMode;
  elements.rootMode.value = state.convertOptions.rootMode;
  elements.spacingMode.value = state.convertOptions.spacingMode;
  elements.includeNotes.checked = state.convertOptions.includeNotes;
  elements.includeLabels.checked = state.convertOptions.includeLabels;
  elements.includeLinks.checked = state.convertOptions.includeLinks;
  elements.includeMarkers.checked = state.convertOptions.includeMarkers;
  elements.includeFrontMatter.checked = state.convertOptions.includeFrontMatter;
  elements.includeCheckReport.checked = state.convertOptions.includeCheckReport;
  elements.exportIndexFile.checked = state.convertOptions.exportIndexFile;
}

function loadConvertOptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);
    return sanitizeConvertOptions(parsed);
  } catch (error) {
    console.warn("[xmind2md] load options failed:", error);
    return { ...DEFAULT_OPTIONS };
  }
}

function saveConvertOptions(options) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch (error) {
    console.warn("[xmind2md] save options failed:", error);
  }
}

function sanitizeConvertOptions(options) {
  const next = { ...DEFAULT_OPTIONS };

  if (VALID_OUTPUT_MODES.has(options?.outputMode)) {
    next.outputMode = options.outputMode;
  }
  if (VALID_ROOT_MODES.has(options?.rootMode)) {
    next.rootMode = options.rootMode;
  }
  if (VALID_SPACING_MODES.has(options?.spacingMode)) {
    next.spacingMode = options.spacingMode;
  }
  if (typeof options?.includeNotes === "boolean") {
    next.includeNotes = options.includeNotes;
  }
  if (typeof options?.includeLabels === "boolean") {
    next.includeLabels = options.includeLabels;
  }
  if (typeof options?.includeLinks === "boolean") {
    next.includeLinks = options.includeLinks;
  }
  if (typeof options?.includeMarkers === "boolean") {
    next.includeMarkers = options.includeMarkers;
  }
  if (VALID_EXPORT_TEMPLATES.has(options?.exportTemplate)) {
    next.exportTemplate = options.exportTemplate;
  }
  if (typeof options?.includeFrontMatter === "boolean") {
    next.includeFrontMatter = options.includeFrontMatter;
  }
  if (typeof options?.includeCheckReport === "boolean") {
    next.includeCheckReport = options.includeCheckReport;
  }
  if (typeof options?.exportIndexFile === "boolean") {
    next.exportIndexFile = options.exportIndexFile;
  }

  return next;
}

function createAppError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function mapErrorToUserMessage(error) {
  const code = error?.code;
  if (code === ERROR_CODE.NO_FILE) return MESSAGE.noFile;
  if (code === ERROR_CODE.INVALID_FILE_TYPE) return MESSAGE.invalidType;
  if (code === ERROR_CODE.PARSE_FAILED) return MESSAGE.parseFailed;
  if (code === ERROR_CODE.NO_CONTENT) return MESSAGE.noContent;
  return MESSAGE.convertFailed;
}

function isValidXmindFile(file) {
  return Boolean(file && typeof file.name === "string" && file.name.toLowerCase().endsWith(".xmind"));
}

async function convertXmindToMarkdown(file, options) {
  if (!file) {
    throw createAppError(ERROR_CODE.NO_FILE);
  }
  if (!isValidXmindFile(file)) {
    throw createAppError(ERROR_CODE.INVALID_FILE_TYPE);
  }
  if (file.size === 0) {
    throw createAppError(ERROR_CODE.NO_CONTENT);
  }

  let arrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  let entries;
  try {
    entries = parseZipCentralDirectory(arrayBuffer);
  } catch {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  const contentJsonEntry = findEntry(entries, "content.json");
  const contentXmlEntry = findEntry(entries, "content.xml");

  if (!contentJsonEntry && !contentXmlEntry) {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  let sheets = [];
  try {
    if (contentJsonEntry) {
      const rawJson = await readEntryText(arrayBuffer, contentJsonEntry);
      sheets = normalizeJsonSheets(JSON.parse(rawJson));
    } else if (contentXmlEntry) {
      const rawXml = await readEntryText(arrayBuffer, contentXmlEntry);
      sheets = normalizeXmlSheets(rawXml);
    }
  } catch (error) {
    if (error?.code) throw error;
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw createAppError(ERROR_CODE.NO_CONTENT);
  }

  const renderableSheets = prepareRenderableSheets(sheets, options.rootMode);
  if (renderableSheets.length === 0) {
    throw createAppError(ERROR_CODE.NO_CONTENT);
  }

  let checkIssues = [];
  try {
    checkIssues = runRuleChecks(renderableSheets);
  } catch (error) {
    console.warn("[xmind2md] check rules failed, skipped:", error);
    checkIssues = [];
  }

  let markdown = "";
  try {
    markdown = sheetsToMarkdown(renderableSheets, options);
  } catch {
    throw createAppError(ERROR_CODE.CONVERT_FAILED);
  }

  if (!markdown.trim()) {
    throw createAppError(ERROR_CODE.NO_CONTENT);
  }

  return {
    markdown,
    stats: buildConvertStats(renderableSheets, file.name, markdown),
    checkIssues,
    hasWarnings: checkIssues.some((issue) => issue.severity === "warning"),
  };
}

function prepareRenderableSheets(sheets, rootMode) {
  const result = [];

  for (const sheet of sheets) {
    if (!sheet?.rootTopic) continue;

    const nodes =
      rootMode === "ignoreRoot"
        ? (sheet.rootTopic.children || []).filter(Boolean)
        : [sheet.rootTopic].filter(Boolean);

    if (nodes.length === 0) continue;
    result.push({
      title: stringValue(sheet.title) || nodes[0]?.title || "Untitled Sheet",
      nodes,
    });
  }

  return result;
}

function buildConvertStats(sheets, fileName, markdown) {
  let nodeCount = 0;
  let noteCount = 0;

  for (const sheet of sheets) {
    for (const node of sheet.nodes) {
      walkNode(node, (topic) => {
        nodeCount += 1;
        if (topic.notes) noteCount += 1;
      });
    }
  }

  return {
    fileName,
    nodeCount,
    noteCount,
    lineCount: countMarkdownLines(markdown),
  };
}

function runRuleChecks(sheets) {
  const issues = [];
  let issueCounter = 0;

  const pushIssue = (severity, message, nodePath = "") => {
    issueCounter += 1;
    issues.push({
      id: `issue_${issueCounter}`,
      severity,
      message,
      nodePath,
    });
  };

  for (const sheet of sheets) {
    const sheetPath = stringValue(sheet.title) || "Untitled Sheet";
    checkDuplicateSiblingTitles(sheet.nodes, sheetPath, pushIssue);

    for (const node of sheet.nodes || []) {
      runChecksForNode(node, 1, [sheetPath], pushIssue);
    }
  }

  return issues;
}

function runChecksForNode(node, depth, parentPath, pushIssue) {
  const nodeLabel = nodeTitleForPath(node);
  const currentPath = parentPath.concat(nodeLabel);
  const nodePath = currentPath.join(" > ");
  const nodeRawTitle = stringValue(node.rawTitle);
  const nodeText = stringValue(node.rawTitle || node.title);

  if (!nodeRawTitle) {
    pushIssue("warning", "发现空标题节点", nodePath);
  }

  if (depth > CHECK_RULES.maxDepth) {
    pushIssue("warning", `节点层级超过 ${CHECK_RULES.maxDepth} 层`, nodePath);
  }

  if (nodeText.length > CHECK_RULES.maxTextLength) {
    pushIssue("info", `节点文本较长（超过 ${CHECK_RULES.maxTextLength} 字）`, nodePath);
  }

  if (node.notePresent && !stringValue(node.notes)) {
    pushIssue("warning", "发现空备注节点", nodePath);
  }

  if (node.link && !isLikelyValidLink(node.link)) {
    pushIssue("warning", "链接格式可能无效", nodePath);
  }

  const children = Array.isArray(node.children) ? node.children : [];
  checkDuplicateSiblingTitles(children, nodePath, pushIssue);

  const addonCount = countNodeAddonTypes(node);
  if (children.length === 0 && addonCount >= CHECK_RULES.isolatedAddonThreshold) {
    pushIssue("info", "孤立节点包含较多附加信息，建议确认结构是否完整", nodePath);
  }

  for (const child of children) {
    runChecksForNode(child, depth + 1, currentPath, pushIssue);
  }
}

function checkDuplicateSiblingTitles(nodes, parentPath, pushIssue) {
  const titleMap = new Map();

  for (const node of nodes || []) {
    const raw = stringValue(node.rawTitle || node.title).toLowerCase();
    if (!raw) continue;
    const list = titleMap.get(raw) || [];
    list.push(node);
    titleMap.set(raw, list);
  }

  for (const group of titleMap.values()) {
    if (group.length < 2) continue;
    const title = nodeTitleForPath(group[0]);
    pushIssue("warning", `同级节点标题重复：${title}`, parentPath);
  }
}

function countNodeAddonTypes(node) {
  let count = 0;
  if (Array.isArray(node.labels) && node.labels.length > 0) count += 1;
  if (Array.isArray(node.markers) && node.markers.length > 0) count += 1;
  if (node.link) count += 1;
  if (stringValue(node.notes)) count += 1;
  return count;
}

function nodeTitleForPath(node) {
  const raw = stringValue(node?.rawTitle);
  if (raw) return raw;
  const fallback = stringValue(node?.title);
  if (fallback && fallback !== "Untitled") return fallback;
  return "(空标题)";
}

function isLikelyValidLink(link) {
  const raw = String(link || "").trim();
  if (!raw) return false;
  if (/^(https?:\/\/|mailto:|file:\/\/|xmind:|ftp:\/\/)/i.test(raw)) return true;
  if (/^www\.[^\s]+\.[^\s]+$/i.test(raw)) return true;
  return false;
}

function walkNode(node, onVisit) {
  if (!node) return;
  onVisit(node);
  for (const child of node.children || []) {
    walkNode(child, onVisit);
  }
}

function countMarkdownLines(markdown) {
  const normalized = String(markdown || "").replace(/\n$/, "");
  if (!normalized) return 0;
  return normalized.split("\n").length;
}

function sheetsToMarkdown(sheets, options) {
  const blocks = sheets
    .map((sheet, index) => renderSheetMarkdown(sheet, index, options))
    .filter(Boolean);

  const separator = resolveSheetSeparator(options);
  return `${blocks.join(separator)}\n`;
}

function renderSheetMarkdown(sheet, index, options) {
  const lines = [];
  lines.push(`# ${escapeMarkdown(sheet.title || `Sheet ${index + 1}`)}`);

  if (options.spacingMode === "normalSpacing") {
    lines.push("");
  }

  if (options.outputMode === "heading") {
    renderHeadingMode(sheet.nodes, 0, lines, options);
  } else if (options.outputMode === "list") {
    renderListMode(sheet.nodes, 0, lines, options);
  } else {
    renderMixedMode(sheet.nodes, 0, lines, options);
  }

  trimTrailingBlankLines(lines);
  return lines.join("\n");
}

function renderHeadingMode(nodes, depth, lines, options) {
  for (const node of nodes) {
    const level = Math.min(6, depth + 2);
    lines.push(`${"#".repeat(level)} ${formatNodeTitle(node, options)}`);
    appendNodeAddonLines(lines, node, options, { mode: "heading", depth });

    if (options.spacingMode === "normalSpacing") {
      lines.push("");
    }

    renderHeadingMode(node.children || [], depth + 1, lines, options);
  }
}

function renderListMode(nodes, depth, lines, options) {
  nodes.forEach((node, index) => {
    writeListNode(node, depth, lines, options);
    if (options.spacingMode === "normalSpacing" && depth === 0 && index < nodes.length - 1) {
      lines.push("");
    }
  });
}

function writeListNode(node, depth, lines, options) {
  const indent = "  ".repeat(depth);
  lines.push(`${indent}- ${formatNodeTitle(node, options)}`);
  appendNodeAddonLines(lines, node, options, { mode: "list", depth });

  for (const child of node.children || []) {
    writeListNode(child, depth + 1, lines, options);
  }
}

function renderMixedMode(nodes, depth, lines, options) {
  for (const node of nodes) {
    writeMixedNode(node, depth, lines, options);
  }
}

function writeMixedNode(node, depth, lines, options) {
  if (depth <= 1) {
    const level = Math.min(6, depth + 2);
    lines.push(`${"#".repeat(level)} ${formatNodeTitle(node, options)}`);
    appendNodeAddonLines(lines, node, options, { mode: "heading", depth });
    if (options.spacingMode === "normalSpacing") {
      lines.push("");
    }
  } else {
    const listDepth = depth - 2;
    const indent = "  ".repeat(listDepth);
    lines.push(`${indent}- ${formatNodeTitle(node, options)}`);
    appendNodeAddonLines(lines, node, options, { mode: "list", depth: listDepth });
  }

  for (const child of node.children || []) {
    writeMixedNode(child, depth + 1, lines, options);
  }
}

function appendNodeAddonLines(lines, node, options, context) {
  const prefix = context.mode === "list" ? "  ".repeat(context.depth + 1) : "";
  const labels = getTemplateAddonLabels(options.exportTemplate);

  if (options.includeLabels && Array.isArray(node.labels) && node.labels.length > 0) {
    const labelText = node.labels.map((label) => escapeMarkdown(label)).join(", ");
    if (options.exportTemplate === "outline") {
      lines.push(`${prefix}[标签] ${labelText}`);
    } else {
      lines.push(`${prefix}${labels.labels}${labelText}`);
    }
  }

  if (options.includeMarkers && Array.isArray(node.markers) && node.markers.length > 0) {
    const markerText = node.markers.map((marker) => escapeMarkdown(marker)).join(", ");
    if (options.exportTemplate === "outline") {
      lines.push(`${prefix}[标记] ${markerText}`);
    } else {
      lines.push(`${prefix}${labels.markers}${markerText}`);
    }
  }

  if (options.includeLinks && node.link) {
    const link = toMarkdownLink(node.link);
    if (link) {
      if (options.exportTemplate === "outline") {
        lines.push(`${prefix}[链接](${link})`);
      } else {
        lines.push(`${prefix}${labels.links}[打开链接](${link})`);
      }
    }
  }

  if (options.includeNotes && node.notes) {
    const noteLines = splitNoteLines(node.notes);
    for (const note of noteLines) {
      if (options.exportTemplate === "outline") {
        lines.push(`${prefix}${labels.notes}${escapeMarkdown(note)}`);
      } else {
        lines.push(`${prefix}> ${labels.notes}${escapeMarkdown(note)}`);
      }
    }
  }
}

function resolveSheetSeparator(options) {
  if (options.exportTemplate === "outline") {
    return "\n---\n";
  }
  return options.spacingMode === "compactSpacing" ? "\n---\n" : "\n\n---\n\n";
}

function formatNodeTitle(node, options) {
  const baseTitle = escapeMarkdown(node.title || "Untitled");
  if (options.exportTemplate === "test-analysis") {
    return `测试点：${baseTitle}`;
  }
  return baseTitle;
}

function getTemplateAddonLabels(template) {
  if (template === "document") {
    return {
      labels: "标签：",
      markers: "标记：",
      links: "相关链接：",
      notes: "备注：",
    };
  }

  if (template === "test-analysis") {
    return {
      labels: "测试标签：",
      markers: "测试标记：",
      links: "关联链接：",
      notes: "说明：",
    };
  }

  if (template === "outline") {
    return {
      labels: "[标签] ",
      markers: "[标记] ",
      links: "[链接]",
      notes: "注：",
    };
  }

  return {
    labels: "Tags: ",
    markers: "标记：",
    links: "链接：",
    notes: "备注：",
  };
}

function splitNoteLines(notes) {
  return String(notes || "")
    .split(/\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimTrailingBlankLines(lines) {
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
}

function normalizeJsonSheets(data) {
  let rawSheets = [];
  if (Array.isArray(data)) {
    rawSheets = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.sheet)) rawSheets = data.sheet;
    else if (Array.isArray(data.sheets)) rawSheets = data.sheets;
    else if (data.rootTopic || data.topic) rawSheets = [data];
  }

  return rawSheets
    .map((sheet, index) => {
      const rootTopic = normalizeJsonTopic(sheet.rootTopic || sheet.topic || sheet.root);
      if (!rootTopic) return null;
      const title = stringValue(sheet.title) || rootTopic.title || `Sheet ${index + 1}`;
      return { title, rootTopic };
    })
    .filter(Boolean);
}

function normalizeJsonTopic(topic) {
  if (!topic || typeof topic !== "object") return null;

  const rawTitle = stringValue(topic.title);
  const title = rawTitle || "Untitled";
  const notes = extractJsonNotes(topic.notes);
  const notePresent = hasJsonNotesPayload(topic.notes);
  const labels = extractJsonLabels(topic);
  const link = extractJsonLink(topic);
  const markers = extractJsonMarkers(topic);
  const children = collectJsonChildren(topic).map(normalizeJsonTopic).filter(Boolean);

  return { title, rawTitle, notes, notePresent, labels, link, markers, children };
}

function collectJsonChildren(topic) {
  const children = [];
  const source = topic.children;
  if (!source) return children;

  if (Array.isArray(source)) {
    children.push(...source);
    return children;
  }

  if (typeof source !== "object") return children;

  for (const value of Object.values(source)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item.topic)) children.push(...item.topic);
        else if (item.topic) children.push(item.topic);
        else children.push(item);
      }
      continue;
    }

    if (typeof value === "object") {
      if (Array.isArray(value.topic)) children.push(...value.topic);
      else if (value.topic) children.push(value.topic);
      if (Array.isArray(value.topics)) children.push(...value.topics);
      if (Array.isArray(value.attached)) children.push(...value.attached);
    }
  }

  return children;
}

function extractJsonNotes(notes) {
  if (!notes) return "";
  if (typeof notes === "string") return normalizeWhitespace(notes);
  if (typeof notes !== "object") return "";

  if (typeof notes.plain === "string") return normalizeWhitespace(notes.plain);
  if (typeof notes.plain?.content === "string") return normalizeWhitespace(notes.plain.content);
  if (typeof notes.realHTML === "string") return normalizeWhitespace(stripHtml(notes.realHTML));
  if (typeof notes.html === "string") return normalizeWhitespace(stripHtml(notes.html));
  if (typeof notes.content === "string") return normalizeWhitespace(notes.content);

  if (Array.isArray(notes.ops)) {
    const text = notes.ops
      .map((op) => (typeof op.insert === "string" ? op.insert : ""))
      .join("");
    return normalizeWhitespace(text);
  }

  return "";
}

function hasJsonNotesPayload(notes) {
  if (!notes) return false;
  if (typeof notes === "string") return true;
  if (typeof notes !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(notes, "plain")) return true;
  if (Object.prototype.hasOwnProperty.call(notes, "realHTML")) return true;
  if (Object.prototype.hasOwnProperty.call(notes, "html")) return true;
  if (Object.prototype.hasOwnProperty.call(notes, "content")) return true;
  if (Array.isArray(notes.ops)) return true;
  return true;
}

function extractJsonLabels(topic) {
  try {
    const output = [];
    collectTextCandidates(topic.labels, output);
    collectTextCandidates(topic.label, output);
    collectTextCandidates(topic.tags, output);
    collectTextCandidates(topic.labels?.labels, output);
    return dedupeStrings(output);
  } catch (error) {
    console.warn("[xmind2md] labels parse skipped:", error);
    return [];
  }
}

function extractJsonLink(topic) {
  try {
    const candidate = firstString([
      topic.href,
      topic.link,
      topic.hyperlink,
      topic.url,
      topic["xlink:href"],
      topic.relationship,
    ]);
    return normalizeLink(candidate);
  } catch (error) {
    console.warn("[xmind2md] link parse skipped:", error);
    return "";
  }
}

function extractJsonMarkers(topic) {
  try {
    const output = [];
    collectMarkerCandidates(topic.markers, output);
    collectMarkerCandidates(topic.markerRefs, output);
    collectMarkerCandidates(topic["marker-refs"], output);
    collectMarkerCandidates(topic.markerIds, output);
    return dedupeStrings(output.map(humanizeMarker).filter(Boolean));
  } catch (error) {
    console.warn("[xmind2md] markers parse skipped:", error);
    return [];
  }
}

function collectTextCandidates(source, output) {
  if (!source) return;

  if (Array.isArray(source)) {
    for (const item of source) {
      collectTextCandidates(item, output);
    }
    return;
  }

  if (typeof source === "string") {
    const value = source.trim();
    if (value) output.push(value);
    return;
  }

  if (typeof source === "object") {
    const direct = [source.title, source.text, source.name, source.value, source.content];
    for (const value of direct) {
      if (typeof value === "string" && value.trim()) {
        output.push(value.trim());
      }
    }

    collectTextCandidates(source.labels, output);
    collectTextCandidates(source.label, output);
    collectTextCandidates(source.items, output);
    collectTextCandidates(source.data, output);
  }
}

function collectMarkerCandidates(source, output) {
  if (!source) return;

  if (Array.isArray(source)) {
    for (const item of source) {
      collectMarkerCandidates(item, output);
    }
    return;
  }

  if (typeof source === "string") {
    const value = source.trim();
    if (value) output.push(value);
    return;
  }

  if (typeof source === "object") {
    const direct = [
      source.markerId,
      source["marker-id"],
      source.id,
      source.key,
      source.name,
      source.value,
    ];

    for (const value of direct) {
      if (typeof value === "string" && value.trim()) {
        output.push(value.trim());
      }
    }

    collectMarkerCandidates(source.markers, output);
    collectMarkerCandidates(source.markerRefs, output);
    collectMarkerCandidates(source.refs, output);
    collectMarkerCandidates(source.items, output);
    collectMarkerCandidates(source.data, output);
  }
}

function normalizeXmlSheets(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  let sheetElements = directChildrenByName(doc.documentElement, "sheet");
  if (sheetElements.length === 0) {
    sheetElements = Array.from(doc.getElementsByTagName("*")).filter(
      (element) => element.localName === "sheet"
    );
  }

  return sheetElements
    .map((sheet, index) => {
      const rootEl = directChildrenByName(sheet, "topic")[0];
      if (!rootEl) return null;
      const rootTopic = normalizeXmlTopic(rootEl);
      if (!rootTopic) return null;
      const title = directChildText(sheet, "title") || rootTopic.title || `Sheet ${index + 1}`;
      return { title, rootTopic };
    })
    .filter(Boolean);
}

function normalizeXmlTopic(topicEl) {
  if (!topicEl) return null;

  const rawTitle = directChildText(topicEl, "title");
  const title = rawTitle || "Untitled";
  const notes = extractXmlNotes(topicEl);
  const notePresent = hasXmlNotesPayload(topicEl);
  const labels = extractXmlLabels(topicEl);
  const link = extractXmlLink(topicEl);
  const markers = extractXmlMarkers(topicEl);
  const children = [];

  const childrenContainer = directChildrenByName(topicEl, "children")[0];
  if (childrenContainer) {
    const topicsBlocks = directChildrenByName(childrenContainer, "topics");
    for (const block of topicsBlocks) {
      children.push(...directChildrenByName(block, "topic"));
    }
  }

  for (const directTopic of directChildrenByName(topicEl, "topic")) {
    children.push(directTopic);
  }

  return {
    title,
    rawTitle,
    notes,
    notePresent,
    labels,
    link,
    markers,
    children: children.map(normalizeXmlTopic).filter(Boolean),
  };
}

function extractXmlNotes(topicEl) {
  const notesEl = directChildrenByName(topicEl, "notes")[0];
  if (!notesEl) return "";

  const plainEl = directChildrenByName(notesEl, "plain")[0];
  if (plainEl) return normalizeWhitespace(plainEl.textContent || "");

  const htmlEl = directChildrenByName(notesEl, "html")[0];
  if (htmlEl) return normalizeWhitespace(stripHtml(htmlEl.textContent || ""));

  return normalizeWhitespace(notesEl.textContent || "");
}

function hasXmlNotesPayload(topicEl) {
  return directChildrenByName(topicEl, "notes").length > 0;
}

function extractXmlLabels(topicEl) {
  try {
    const output = [];

    const labelsContainer = directChildrenByName(topicEl, "labels")[0];
    if (labelsContainer) {
      for (const labelEl of Array.from(labelsContainer.children || [])) {
        if (labelEl.localName === "label") {
          const value = normalizeWhitespace(labelEl.textContent || "");
          if (value) output.push(value);
        }
      }
    }

    for (const labelEl of directChildrenByName(topicEl, "label")) {
      const value = normalizeWhitespace(labelEl.textContent || "");
      if (value) output.push(value);
    }

    return dedupeStrings(output);
  } catch (error) {
    console.warn("[xmind2md] xml labels parse skipped:", error);
    return [];
  }
}

function extractXmlLink(topicEl) {
  try {
    return normalizeLink(
      firstString([
        topicEl.getAttribute("xlink:href"),
        topicEl.getAttribute("href"),
        topicEl.getAttribute("xlinkHref"),
      ])
    );
  } catch (error) {
    console.warn("[xmind2md] xml link parse skipped:", error);
    return "";
  }
}

function extractXmlMarkers(topicEl) {
  try {
    const output = [];

    const containers = [
      ...directChildrenByName(topicEl, "marker-refs"),
      ...directChildrenByName(topicEl, "markerRefs"),
    ];

    for (const container of containers) {
      for (const markerEl of Array.from(container.children || [])) {
        if (markerEl.localName !== "marker-ref" && markerEl.localName !== "markerRef") continue;
        const markerId = firstString([
          markerEl.getAttribute("marker-id"),
          markerEl.getAttribute("markerId"),
          markerEl.getAttribute("id"),
        ]);
        if (markerId) output.push(markerId);
      }
    }

    for (const markerEl of directChildrenByName(topicEl, "marker-ref")) {
      const markerId = firstString([
        markerEl.getAttribute("marker-id"),
        markerEl.getAttribute("markerId"),
        markerEl.getAttribute("id"),
      ]);
      if (markerId) output.push(markerId);
    }

    return dedupeStrings(output.map(humanizeMarker).filter(Boolean));
  } catch (error) {
    console.warn("[xmind2md] xml markers parse skipped:", error);
    return [];
  }
}

function humanizeMarker(markerId) {
  const raw = String(markerId || "").trim();
  if (!raw) return "";

  const normalized = raw.replace(/_/g, "-");
  const priorityMatch = normalized.match(/^priority-(\d+)$/i);
  if (priorityMatch) {
    return `Priority ${priorityMatch[1]}`;
  }

  const taskMatch = normalized.match(/^task-(.+)$/i);
  if (taskMatch) {
    return `Task ${toTitleCase(taskMatch[1].replace(/-/g, " "))}`;
  }

  return toTitleCase(normalized.replace(/-/g, " "));
}

function toTitleCase(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function dedupeStrings(values) {
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }

  return output;
}

function firstString(values) {
  for (const value of values || []) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeLink(link) {
  if (typeof link !== "string") return "";
  return link.trim();
}

function toMarkdownLink(link) {
  const normalized = normalizeLink(link);
  if (!normalized) return "";

  try {
    return encodeURI(normalized).replace(/\(/g, "%28").replace(/\)/g, "%29");
  } catch {
    return normalized.replace(/\s/g, "%20");
  }
}

function renderMarkdownPreview(markdown) {
  const lines = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const html = [];
  let inList = false;

  const closeListIfNeeded = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderMarkdownInline(listMatch[1])}</li>`);
      continue;
    }

    closeListIfNeeded();

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderMarkdownInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (quoteMatch) {
      html.push(`<blockquote>${renderMarkdownInline(quoteMatch[1])}</blockquote>`);
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    html.push(`<p>${renderMarkdownInline(line.trim())}</p>`);
  }

  closeListIfNeeded();

  if (html.length === 0) {
    return `<p>${escapeHtml(MESSAGE.noContent)}</p>`;
  }

  return html.join("\n");
}

function renderMarkdownInline(text) {
  const raw = String(text || "");
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let output = "";
  let match;

  while ((match = pattern.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index);
    output += escapeHtml(before);

    const label = escapeHtml(match[1]);
    const url = sanitizePreviewUrl(match[2]);
    output += `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`;

    lastIndex = pattern.lastIndex;
  }

  output += escapeHtml(raw.slice(lastIndex));
  return output;
}

function sanitizePreviewUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "#";

  if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw)) {
    return raw;
  }

  return "#";
}

function directChildrenByName(node, localName) {
  return Array.from(node?.children || []).filter((element) => element.localName === localName);
}

function directChildText(node, localName) {
  const child = directChildrenByName(node, localName)[0];
  return normalizeWhitespace(child?.textContent || "");
}

function stringValue(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return doc.body?.textContent || "";
}

function escapeMarkdown(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/([`*_{}\[\]()#+!|>])/g, "\\$1");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function findEntry(entries, targetFileName) {
  return entries.find((entry) => {
    const normalized = entry.fileName.replace(/\\/g, "/");
    return normalized === targetFileName || normalized.endsWith(`/${targetFileName}`);
  });
}

async function readEntryText(arrayBuffer, entry) {
  const bytes = await extractEntryBytes(arrayBuffer, entry);
  return new TextDecoder("utf-8").decode(bytes);
}

async function extractEntryBytes(arrayBuffer, entry) {
  const view = new DataView(arrayBuffer);
  const localOffset = entry.localHeaderOffset;
  const localSignature = view.getUint32(localOffset, true);
  if (localSignature !== 0x04034b50) {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  const fileNameLength = view.getUint16(localOffset + 26, true);
  const extraLength = view.getUint16(localOffset + 28, true);
  const dataOffset = localOffset + 30 + fileNameLength + extraLength;
  const compressedBytes = new Uint8Array(arrayBuffer, dataOffset, entry.compressedSize);

  if (entry.compressionMethod === 0) return compressedBytes;
  if (entry.compressionMethod === 8) return inflateDeflateRaw(compressedBytes);

  throw createAppError(ERROR_CODE.PARSE_FAILED);
}

async function inflateDeflateRaw(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function parseZipCentralDirectory(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const eocdOffset = findEocdOffset(view);
  if (eocdOffset < 0) {
    throw createAppError(ERROR_CODE.PARSE_FAILED);
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);
  const entries = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x02014b50) {
      throw createAppError(ERROR_CODE.PARSE_FAILED);
    }

    const gpFlag = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const fileNameBytes = new Uint8Array(arrayBuffer, offset + 46, fileNameLength);
    const fileName = decodeZipFileName(fileNameBytes, gpFlag);

    entries.push({
      fileName,
      compressedSize,
      compressionMethod,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries.filter((entry) => !entry.fileName.endsWith("/"));
}

function decodeZipFileName(bytes, gpFlag) {
  const utf8 = Boolean(gpFlag & 0x0800);
  if (utf8) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  let text = "";
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }
  return text;
}

function findEocdOffset(view) {
  const min = Math.max(0, view.byteLength - 65557);
  for (let i = view.byteLength - 22; i >= min; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      return i;
    }
  }
  return -1;
}
