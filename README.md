# MarkEdit - 本地 Markdown 编辑器

一个功能完备、可定制的本地 Markdown 编辑器，提供类似 Typora 的使用体验。

## 新增核心功能

### 1. 增强型 Markdown 工具栏
- **快速格式化**: 支持标题 (H1-H6)、加粗、斜体、删除线、行内代码。
- **结构化内容**: 快捷插入引用、无序列表、有序列表、任务列表、代码块、分割线。
- **多媒体与数据**: 支持链接、图片插入及基础表格生成。
- **清除格式**: 一键清理选中文本的 Markdown 标记。

### 2. 动态布局与交互
- **三栏可拖拽布局**: 文件列表、编辑器、预览区宽度均可自由调整。
- **持久化配置**: 自动记忆你的布局比例，下次打开恢复如初。
- **全能快捷键**: 
  - `Ctrl + B`: 加粗 | `Ctrl + I`: 斜体 | `Ctrl + Shift + X`: 删除线
  - `Ctrl + E`: 行内代码 | `Ctrl + K`: 插入链接 | `Ctrl + Shift + C`: 代码块
  - `Ctrl + Alt + 1/2/3`: H1/H2/H3 标题
  - `Ctrl + Shift + 7/8`: 有序/无序列表
  - `Ctrl + S`: 保存当前文件

### 3. 专业 UI/UX
- **实时状态栏**: 显示当前文件名、保存状态、字数统计及行数。
- **高级预览**: 采用 `remark-gfm` 插件，完美支持表格、任务列表等高级语法。
- **独立滚动**: 各个区域互不干扰，提供极佳的超长文档编辑体验。
- **极致性能**: 基于 CodeMirror 6，处理大文件流畅无压力。

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
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 项目结构
- `src/lib/markdownActions.ts`: 封装了所有 Markdown 文本操作逻辑。
- `src/components/ResizableLayout.tsx`: 实现三栏拖拽核心逻辑。
- `src/components/MarkdownToolbar.tsx`: 顶部快捷操作工具栏。
- `src/components/StatusBar.tsx`: 底部信息展示。
