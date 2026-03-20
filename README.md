# XMind to Markdown (macOS Desktop)
<img width="1220" height="820" alt="image" src="https://github.com/user-attachments/assets/b3ff2dbe-635d-41c8-8f05-f33fbaca7f79" />


一个纯本地运行的 XMind 转 Markdown 工具（Electron 桌面应用）。

不会上传文件到服务器，所有解析与转换都在本机完成。

## Quick Links

- 仓库地址：[xmind-to-markdown](https://github.com/Madaochenggou/xmind-to-markdown)
- Issue 反馈：请在 GitHub `Issues` 提交

## 功能概览（V2）

- 批量导入 `.xmind`（文件选择 / 拖拽）
- 批量转换（每个文件独立状态：`pending / converting / success / error`）
- 文件列表管理（选中查看、移除单个、清空全部）
- Markdown 源码 / 预览切换（预览支持标题、列表、引用、链接）
- 转换规则配置
  - `outputMode`: `heading | list | mixed`
  - `rootMode`: `keepRoot | ignoreRoot`
  - `spacingMode`: `normalSpacing | compactSpacing`
  - `includeNotes`
  - `includeLabels`
  - `includeLinks`
  - `includeMarkers`
- 配置本地持久化（重启后自动恢复）
- 导出单个 `.md`
- 导出全部成功文件（选择目录、同名自动加序号、不覆盖）

## 技术栈

- Electron
- 原生 HTML / CSS / JavaScript
- 无后端依赖

## 截图（Screenshots）

当前仓库还没有提交截图文件。  
建议放在 `docs/images/`，例如：

- `docs/images/file-list.png`（文件列表与批量操作）
- `docs/images/preview-mode.png`（Markdown 预览视图）
- `docs/images/export-result.png`（导出结果提示）

## 项目结构

```text
.
├── app.js          # 前端核心逻辑（状态管理、解析、转换、预览、批量导出调用）
├── index.html      # 页面结构
├── styles.css      # 页面样式
├── main.js         # Electron 主进程（窗口、目录选择、批量写文件）
├── preload.js      # 安全桥接（renderer <-> main IPC）
└── package.json
```

## 本地运行（开发）

```bash
npm install
npm start
```

## 安装使用（最终用户）

在 `dist/` 目录中使用对应安装包：

- Apple Silicon (M 芯片): `XMind2Markdown-2.0.0-arm64.dmg`
- Intel 芯片: `XMind2Markdown-2.0.0-x64.dmg`

## 打包安装包

### Intel (x64)

```bash
npm run pack:mac:intel
```

### Apple Silicon (arm64)

```bash
npx electron-builder --mac dmg --arm64
```

打包产物位于 `dist/`，例如：

- `XMind2Markdown-2.0.0-arm64.dmg`
- `XMind2Markdown-2.0.0-x64.dmg`

## 使用流程

1. 添加一个或多个 `.xmind` 文件（支持拖拽）
2. 在左侧列表选择要查看的文件
3. 配置转换规则
4. 点击「全部转换」
5. 在右侧查看当前文件源码或预览
6. 按需复制 / 下载当前文件，或「导出全部」

## 导出全部说明

- 仅导出 `success` 文件
- 导出目录由用户选择
- 同名文件自动处理，不覆盖原文件：
  - `xxx.md`
  - `xxx (1).md`
  - `xxx (2).md`
- 单文件写入失败不会中断其他文件

## 错误处理策略

- 非 `.xmind` 文件自动跳过并提示
- 单文件解析失败不会影响其他文件转换
- 节点附加信息（labels / links / markers）解析失败会降级忽略，不阻断主流程
- 导出时单文件失败不阻断整批导出

## 当前版本限制

- 预览为基础 Markdown 渲染，不含表格、Mermaid、数学公式、代码高亮
- 不支持图片资源导出
- 不支持关系线 / Summary
- 不支持反向 Markdown -> XMind

## Roadmap

- [x] V1：单文件转换、基础配置、本地持久化
- [x] V2：批量转换、源码/预览切换、labels/links/markers、导出全部
- [ ] V2.x：增强预览能力（更完整 Markdown 兼容）
- [ ] V2.x：提升大文件批量转换性能与交互反馈

## Contributing

欢迎通过 Issue / PR 参与贡献。

建议流程：

1. Fork 仓库并创建分支
2. 提交改动并自测
3. 发起 Pull Request，说明改动动机与影响范围

建议提交前检查：

- 保持纯本地处理，不引入不必要后端依赖
- 保持 V2 的多文件状态流清晰
- 不做与当前需求无关的大规模重构

## License

本项目当前使用 `MIT` 许可证。
