## /car:plan

将 `work/outputs/analysis.json` 转为可执行计划，输出到 `work/outputs/plan.json`。

### 输入

- `work/outputs/analysis.json`
- `work/inputs/constraints.json`（用于约束时间、地域、精力与风险）

### 输出

写入 `work/outputs/plan.json`，建议包含：

- `milestones`：里程碑（例如 2 周/4 周/8 周）
- `weeklyRoutine`：每周节奏（学习/项目/复盘/投递）
- `projects`：作品集项目清单（每个项目的目标、范围、验收标准）
- `learningPath`：学习路径（资源类型与顺序）
- `resumeAndInterview`：简历迭代与面试训练动作清单
- `networking`：社交与内推打法（可选）

### 规划原则

- 可执行：每一项都有明确产出物与验收标准。
- 可迭代：按里程碑滚动更新，不追求一次性完美。
- 约束优先：时间投入不足时，优先高杠杆动作（作品集 + 面试训练 + 投递节奏）。
