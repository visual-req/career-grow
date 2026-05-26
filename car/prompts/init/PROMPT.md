## /car:init

创建职业发展工作目录与基础数据结构。

### 目标

- 创建目录：
  - `work/inputs/`：用户输入与采集结果（源数据）
  - `work/outputs/`：分析与规划产物（结构化输出）
  - `work/artifacts/`：中间成果物与沉淀（过程与结论）
- 生成基础文件（如不存在）：
  - `work/inputs/profile.json`
  - `work/inputs/hashtag.json`
  - `work/inputs/skills.json`
  - `work/inputs/languages.json`
  - `work/inputs/education.json`
  - `work/inputs/experience.json`
  - `work/inputs/awards.json`
  - `work/inputs/honors.json`
  - `work/inputs/achievements.json`
  - `work/inputs/certificates.json`
  - `work/inputs/artifacts.json`
  - `work/inputs/assets.json`
  - `work/inputs/projects.json`
  - `work/inputs/social_media.json`
  - `work/inputs/speech.json`
  - `work/inputs/community.json`
  - `work/inputs/activities.json`
  - `work/inputs/strengths.json`
  - `work/inputs/weaknesses.json`
  - `work/inputs/goals.json`
  - `work/inputs/constraints.json`
  - `work/inputs/job_intent.json`
  - `work/inputs/personality.json`
  - `work/outputs/analysis.json`
  - `work/outputs/plan.json`

### profile.json 建议结构

```json
{
  "basics": {
    "name": "",
    "age": null,
    "gender": "unknown",
    "location": "",
    "currentTitle": "",
    "yearsOfExperience": null
  },
  "summary": "",
  "preferences": {
    "industries": [],
    "roleDirections": [],
    "workMode": "onsite|hybrid|remote|any",
    "geoPreference": "",
    "salaryExpectation": ""
  }
}
```

### education.json 建议结构

```json
{
  "items": [
    {
      "school": "",
      "degree": "",
      "field": "",
      "start": "",
      "end": "",
      "highlights": []
    }
  ]
}
```

### experience.json 建议结构

```json
{
  "items": [
    {
      "company": "",
      "title": "",
      "location": "",
      "start": "",
      "end": "",
      "highlights": []
    }
  ]
}
```

### awards.json / certificates.json / artifacts.json 建议结构

```json
{
  "items": []
}
```

### goals.json 建议结构

```json
{
  "timeWindow": "",
  "successCriteria": "",
  "items": [
    {
      "industry": "",
      "role": "",
      "salary": ""
    }
  ]
}
```

### 执行要点

- 不覆盖用户已填写的文件：若文件存在，仅校验 JSON 是否可解析；必要时修复为空对象或补齐缺失字段（保持最小变更）。
- 不生成 Markdown 文档：仅创建目录与 JSON 骨架。
