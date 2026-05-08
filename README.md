# MarkEdit - 本地 Markdown 编辑器

一个功能完备、可定制的本地 Markdown 编辑器，提供类似 Typora 的本地写作体验。

## 核心功能

### 1. 本地 Markdown 编辑

- **CodeMirror 编辑器**: 基于 CodeMirror 6，支持流畅的大文档编辑。
- **Typora-like 显示**: 标题、行内格式、图片、代码块和链接在编辑器中以更接近最终文档的方式显示。
- **常用格式化**: 支持标题 H1-H6、加粗、斜体、下划线、删除线、行内代码、引用、列表、任务列表、表格和分割线。
- **代码块增强**: 支持代码块独立显示、语言选择和语法高亮。
- **图片能力**: 支持图片粘贴、拖拽、本地插入，并在编辑器内直接显示。
- **暗色模式**: 支持浅色 / 深色主题切换。

### 2. 完整超链接功能

- **统一入口**: 支持顶部菜单“格式 -> 插入链接”、右键菜单“插入链接”、工具栏链接按钮和 `Ctrl + K` 快捷键。
- **选中文本插入**: 选中 `OpenAI` 后输入 `https://openai.com`，会生成 `[OpenAI](https://openai.com/)`。
- **未选中文本插入**: 会弹出中文对话框，可输入“链接文本”和“链接地址”。
- **已有链接编辑**: 光标或选区位于 `[文本](url)` 内时再次执行插入链接，会进入编辑链接模式。
- **URL 规范化**: 自动 trim；输入 `openai.com` 会自动补全为 `https://openai.com/`。
- **安全协议**: 支持 `http://`、`https://`、`mailto:`，暂不开放 `file:`。
- **Typora-like 链接显示**: 光标不在链接范围内时隐藏 Markdown 标记，只显示链接文本；光标进入后显示完整源码。
- **Ctrl + 点击打开**: 普通点击进入编辑，`Ctrl + 鼠标点击` 会在浏览器中打开链接。

### 3. 自动保存、草稿恢复与备份

- **30 秒自动保存**: 当前文件有未保存修改时，每 30 秒自动保存一次。
- **避免重复保存**: 内容没有变化时不会重复写入文件。
- **状态栏反馈**: 底部状态栏显示“已保存”“未保存”“正在自动保存...”“已自动保存”“自动保存失败”“草稿已保存”。
- **最后保存时间**: 鼠标 hover 保存状态可查看上次保存时间。
- **本地草稿**: 编辑后自动将草稿写入 localStorage，防止浏览器刷新、关闭或程序异常导致内容丢失。
- **草稿恢复**: 重新打开文件时，如果检测到比正式文件更新的草稿，会提示恢复或丢弃。
- **安全解析**: 草稿读取使用 try/catch，localStorage 损坏不会导致黑屏。
- **自动备份**: 手动保存和自动保存前保留旧版本到 `notes/.backups/`。
- **备份数量限制**: 每个文件默认最多保留最近 5 个备份，避免无限增长。

### 4. 文件与导入导出

- **本地 notes 目录**: Markdown 文件保存到本地 `notes/`。
- **文件管理**: 支持新建、打开、保存、删除、重命名。
- **导入文档**: 支持导入 `.md`、`.markdown`、`.txt`。
- **导出格式**: 支持导出 Markdown、TXT、HTML、PDF。
- **左侧文件 / 大纲**: 支持文件列表、大纲 Tab、当前标题定位。
- **侧栏拖拽**: 左侧区域宽度可调整。
- **无右侧预览区**: 当前版本保持单编辑器体验，右侧预览区不显示。

### 5. 菜单、右键菜单与快捷键

- **Typora 风格顶部菜单栏**: 文件、编辑、段落、格式、视图、主题和帮助菜单。
- **中文右键菜单**: 常用格式化、块级元素、插入和编辑操作。
- **常用快捷键**:
  - `Ctrl + S`: 保存当前文件
  - `Ctrl + K`: 插入 / 编辑链接
  - `Ctrl + B`: 加粗
  - `Ctrl + I`: 斜体
  - `Ctrl + U`: 下划线
  - `Alt + Shift + 5`: 删除线
  - `Ctrl + Shift + ``: 行内代码
  - `Ctrl + Shift + K`: 代码块
  - `Ctrl + 1/2/3/4/5/6`: H1-H6 标题
  - `Ctrl + Shift + [` / `Ctrl + Shift + ]`: 有序 / 无序列表

## 快速启动

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动应用**

   ```bash
   npm run dev
   ```

3. **访问应用**

   默认访问 [http://localhost:3000](http://localhost:3000)。

   如果 3000 端口已被占用，可单独启动前端到其他端口，例如：

   ```bash
   npm run dev:client -- --port 3002
   ```

## 项目结构

- `src/App.tsx`: 应用主状态、文件保存、自动保存、草稿恢复和命令接入。
- `src/components/LinkDialog.tsx`: 插入 / 编辑链接的中文弹窗。
- `src/components/MarkdownEditor.tsx`: CodeMirror 编辑器封装、图片粘贴拖拽、右键菜单入口。
- `src/components/TopMenuBar.tsx`: 顶部 Typora 风格菜单栏。
- `src/components/ContextMenu.tsx`: 中文右键菜单。
- `src/components/MarkdownToolbar.tsx`: 快捷格式化工具栏。
- `src/components/StatusBar.tsx`: 底部文件、保存状态、字数和行数信息展示。
- `src/components/FileSidebar.tsx`: 左侧文件列表和大纲面板。
- `src/lib/editorCommands.ts`: 顶部菜单、右键菜单和快捷键共用的命令定义。
- `src/lib/executeCommand.ts`: 统一命令执行入口。
- `src/lib/markdownActions.ts`: Markdown 文本操作逻辑，包括链接插入、链接解析和 URL 规范化。
- `src/lib/markdownDecorations.ts`: Typora-like Markdown 装饰与链接显示逻辑。
- `src/lib/imageDecorations.ts`: 编辑器内图片显示装饰。
- `src/lib/codeBlockDecorations.ts`: 代码块独立显示和语言切换装饰。
- `src/lib/autoSave.ts`: 自动保存状态类型与保存时间格式化工具。
- `src/lib/draftStorage.ts`: localStorage 草稿保存、读取、恢复判断和清理。
- `src/lib/settings.ts`: 自动保存、草稿、备份等编辑器设置默认值。
- `server/index.ts`: 本地文件 API、导入保存、删除重命名和自动备份接口。

## 数据与隐私

- `notes/` 用于保存本地 Markdown 文件。
- `notes/.backups/` 用于保存自动生成的旧版本备份。
- 草稿保存在浏览器 localStorage 中，用于异常关闭后的恢复。
- `.gitignore` 默认忽略 `notes/` 和 `notes/.backups/`，避免误提交个人笔记和备份内容。
