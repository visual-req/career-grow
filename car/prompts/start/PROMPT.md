## /car:start

启动前端交互，用表单收集基本信息，并导出到 `work/inputs/*.json`。

### 前端工程

- 前端工程目录：`frontend/`
- 推荐技术栈：Vue + Ant Design Vue

### 数据导入/导出

- 导入：从已有 JSON 回填表单（对应 `profile.json` / `education.json` / `experience.json` / `projects.json` / `artifacts.json` / `assets.json` / `awards.json` / `certificates.json` / `social_media.json` / `speech.json` / `community.json` / `activities.json` / `strengths.json` / `weaknesses.json` / `goals.json` / `constraints.json`）
- 导出：将表单内容导出为 JSON 文件，放入 `work/inputs/`（若浏览器只能下载文件，则手动移动到对应目录）

### 注意

- 避免在前端或导出文件中保存敏感信息。
