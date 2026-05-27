## Installation

本仓库不需要额外安装即可开始编写与提交规划产物；如需运行前端，则需要 Node.js 环境。

### 命令定义位置

`car` 位于：

- `car/SKILL.md`

### 前端工程（可选）

如果你需要一个可交互的采集与展示界面，本仓库已内置前端工程（Vue + Ant Design Vue），位于：

- `frontend/`

具体建议与运行方式见 `docs/workflow.md`。

### 前端运行（需要 Node.js）

建议使用 Node.js 20+：

```bash
cd frontend
npm install
npm run dev
```

### 使用 npx 安装 skill（推荐）

将本 skill 安装到 Trae 的 skills 目录后，即可在对话中使用 `/car:init`、`/car:start`、`/car:analyze`、`/car:plan` 等命令。

macOS / Linux（默认安装到 `~/.trae/skills/`）：

```bash
npx -y github:visual-req/career-grow -- --force
```

安装完成后重启 Trae，确保该目录下的 `car/SKILL.md` 被加载。

```bash
cd frontend
npm install
npm run dev
```
