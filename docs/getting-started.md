## Getting Started

本仓库提供 `car` 的一套“信息采集 → 分析 → 规划落地”闭环。

### 你将得到什么

- 一个固定的工作区目录：`work/`
- 结构化输入：`work/inputs/*.json`（profile、education、experience、projects、social_media、strengths、weaknesses、goals、constraints 等）
- 结构化输出：`work/outputs/analysis.json` 与 `work/outputs/plan.json`
- 一个用于采集与展示的前端工程目录：`frontend/`

### 最快路径

1. 运行 `/car:init` 初始化 `work/` 目录结构与 JSON 骨架
2. 启动前端：进入 `frontend/` 启动开发服务器，打开页面
3. 在前端填写信息并导出/保存到 `work/inputs/`（若只能下载 JSON，则将文件放入对应目录）
4. 运行 `/car:analyze` 读取 `work/inputs/` 并产出 `work/outputs/analysis.json`
5. 运行 `/car:plan` 基于分析生成 `work/outputs/plan.json`

### 命令与 prompts

- 命令说明：`docs/commands.md`
