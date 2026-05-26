## Installation

本仓库不需要额外安装即可开始编写与提交规划产物；如需运行前端，则需要 Node.js 环境。

### 命令定义位置

`car` 位于：

- `car/SKILL.md`

### 前端工程（可选）

如果你需要一个可交互的采集与展示界面，推荐创建一个前端工程（Vue + Ant Design Vue）并放在工作区内，例如：

- `frontend/`

具体建议与运行方式见 `docs/workflow.md`。

### 前端运行（需要 Node.js）

建议使用 Node.js 20+：

```bash
cd frontend
npm install
npm run dev
```

### 使用 npx 创建前端工程

如果你希望用命令行创建前端工程（Vite + Vue + TypeScript），可以使用：

```bash
npx create-vite@latest frontend --template vue-ts
```

再进入目录安装依赖并启动：

```bash
cd frontend
npm install
npm run dev
```
