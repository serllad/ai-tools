# JSON 格式化工具 (JSON Formatter)

轻量、快速、隐私安全的在线 JSON 格式化与校验工具。

## 功能特性

- ✅ JSON 格式化（2 空格缩进）
- ✅ JSON 压缩（去除空白）
- ✅ JSON 校验（中文错误提示）
- ✅ 去转义 / Unicode 解码 / URL 解码
- ✅ CodeMirror 6 编辑器（语法高亮）
- ✅ 拖拽文件上传（.json / .txt）
- ✅ 快捷键（Ctrl+Enter 格式化 / Ctrl+K 清空 / Ctrl+Shift+C 复制）
- ✅ 自动格式化（500ms 防抖）
- ✅ 历史记录（最近 5 条，localStorage）
- ✅ 深色/浅色/跟随系统主题
- ✅ 复制到剪贴板
- ✅ 文件大小 / 字符 / 行数统计
- ✅ 压缩率展示

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **编辑器**: CodeMirror 6
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand
- **测试**: Vitest + Testing Library
- **部署**: CloudBase 静态托管

## 快速开始

```bash
cd json-formatter
npm install
npm run dev     # 开发服务器 http://localhost:5173
npm run build   # 生产构建
npm run test    # 运行测试
```

## 部署

- 当前部署环境：CloudBase（`wh001-d0gpvirgcdeafc90c`）
- 前端访问地址：`https://wh001-d0gpvirgcdeafc90c-1259030424.tcloudbaseapp.com/`
