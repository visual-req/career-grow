---
name: "car"
description: "个人职业发展助手：初始化工作目录、启动前端采集信息、分析职业规划、生成可执行路径。Invoke when user runs /car:init /car:start /car:analyze /car:plan 或要求做个人职业发展规划。"
---

# Career (car)

用于在当前仓库中搭建“个人职业发展”工作区，并基于采集到的个人信息生成分析与可执行规划路径。

## 约定

- 所有产物默认写入 `work/` 目录，避免污染仓库根目录。
- 默认只生成结构化文件（JSON），不主动生成 Markdown 文档（除非用户明确要求）。
- 避免写入或展示敏感信息（身份证号、银行卡、私钥、token、公司机密等）。如用户提供敏感信息，应提示脱敏后再保存。

## 命令

### /car:init

初始化职业规划工作区与基础数据结构。详见 `prompts/init/`。

### /car:start

启动信息采集前端（表单）。前端工程位于 `frontend/`，采集数据写入 `work/inputs/*.json`。详见 `prompts/start/`。

### /car:analyze

分析现状与目标差距，输出到 `work/outputs/analysis.json`。详见 `prompts/analyze/`。

### /car:plan

生成可执行里程碑与周节奏，输出到 `work/outputs/plan.json`。详见 `prompts/plan/`。
