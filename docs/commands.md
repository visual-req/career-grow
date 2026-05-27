## Commands

`car` 提供 4 个命令，对应“初始化 → 采集 → 分析 → 规划”。

### /car:init

- 作用：创建 `work/` 目录结构与基础 JSON 骨架
- 主要产物：
  - `work/inputs/profile.json`
  - `work/inputs/education.json`
  - `work/inputs/experience.json`
  - `work/inputs/projects.json`
  - `work/inputs/artifacts.json`
  - `work/inputs/assets.json`
  - `work/inputs/awards.json`
  - `work/inputs/certificates.json`
  - `work/inputs/social_media.json`
  - `work/inputs/speech.json`
  - `work/inputs/community.json`
  - `work/inputs/activities.json`
  - `work/inputs/strengths.json`
  - `work/inputs/weaknesses.json`
  - `work/inputs/goals.json`
  - `work/inputs/constraints.json`
  - `work/outputs/analysis.json`
  - `work/outputs/plan.json`

### /car:start

- 作用：启动前端交互，采集信息并写入 `work/inputs/`
- 说明：前端工程位于 `frontend/`，数据目录为 `work/`

### /car:analyze

- 作用：读取 `work/inputs/` 并产出分析结果 `work/outputs/analysis.json`
- 输出包含：目标画像、差距清单、定位、策略、风险与约束

### /car:plan

- 作用：把分析转为可执行计划 `work/outputs/plan.json`
- 输出包含：里程碑、每周节奏、作品集项目、学习路径、面试训练与复盘机制
