## /car:analyze

读取 `work/inputs/` 下的 JSON，输出职业发展分析到 `work/outputs/analysis.json`。

### 输入

- `work/inputs/profile.json`
- `work/inputs/education.json`
- `work/inputs/experience.json`
- `work/inputs/projects.json`
- `work/inputs/artifacts.json`
- `work/inputs/assets.json`
- `work/inputs/awards.json`
- `work/inputs/honors.json`
- `work/inputs/achievements.json`
- `work/inputs/certificates.json`
- `work/inputs/social_media.json`
- `work/inputs/speech.json`
- `work/inputs/community.json`
- `work/inputs/activities.json`
- `work/inputs/strengths.json`
- `work/inputs/weaknesses.json`
- `work/inputs/goals.json`
- `work/inputs/constraints.json`
- `work/inputs/skills.json`
- `work/inputs/languages.json`
- `work/inputs/hashtag.json`
- `work/inputs/job_intent.json`
- `work/inputs/personality.json`

### 输出

写入 `work/outputs/analysis.json`，建议包含：

- `targetRole`：目标岗位画像（必备能力、加分项、常见面试考点）
- `gapAnalysis`：当前能力 vs 目标差距（按重要度排序）
- `positioning`：你的定位（优势、短板、可迁移能力、叙事主线）
- `marketStrategy`：投递/内推/作品集/面试策略建议
- `riskAndConstraints`：约束与风险（时间、地域、家庭、健康、经济等）
- `goalPanel`：目标分析（SMART、可行性）
- `personalPanel`：个人信息分析（完整性、一致性）
- `gapAnalysis.domains[]`：差距领域拆解（每个领域单独给结论与建议）

### 输出建议结构（强烈建议按此生成，便于前端消费）

要求：只输出合法 JSON（UTF-8），不要输出 Markdown、解释文字或代码块。

```json
{
  "generatedAt": "YYYY-MM-DD",
  "targetRole": {
    "title": "",
    "industries": [],
    "level": "",
    "mustHave": [],
    "niceToHave": [],
    "interviewFocus": [],
    "keywords": []
  },
  "positioning": {
    "oneLiner": "",
    "narrative": "",
    "strengths": [],
    "weaknesses": [],
    "transferableSkills": [],
    "proofPoints": []
  },
  "goalPanel": {
    "smart": { "checks": [], "score": 0 },
    "feasibility": { "status": "ok|gap|review|unknown|likely|possible|unlikely", "score": 0, "reasons": [] },
    "value": { "summary": "", "factors": [], "questionsToVerify": [] }
  },
  "personalPanel": {
    "completeness": { "missing": [], "notes": [] },
    "consistency": { "issues": [], "notes": [] }
  },
  "gapAnalysis": {
    "summary": "",
    "topGaps": [],
    "domains": [
      { "domain": "", "status": "ok|gap|review", "summary": "", "items": [] }
    ]
  },
  "artifactsPanel": {
    "insights": [
      { "id": "", "category": "开源项目|图书|论文|标准|演讲|课程|视频课|其他", "name": "", "summary": [], "risks": [] }
    ]
  },
  "resumePreparationAdvice": {
    "checklist": [],
    "rewriteSuggestions": [],
    "projectCaseSuggestions": []
  },
  "workDevelopmentAdvice": {
    "evenIfNoJobHopping": true,
    "recommendedProjectTypes": [],
    "recommendedRoles": [],
    "projectExperienceUpgrade": [],
    "skillAccumulationPlan": []
  },
  "certificationAdvice": {
    "recommended": [],
    "notRecommended": [],
    "rationale": [],
    "studyPlan": []
  },
  "professionalSkillsAdvice": {
    "summary": "",
    "focusAreas": [],
    "gaps": [],
    "recommendations": [],
    "projectPractice": [],
    "weeklyPlan": []
  },
  "languageAbilityAdvice": {
    "summary": "",
    "current": [],
    "gaps": [],
    "recommendations": [],
    "weeklyPlan": [],
    "proofSuggestions": []
  },
  "outputPublishingAdvice": {
    "whatToPublish": [],
    "whereToPublish": [],
    "cadence": [],
    "repurposePlan": []
  },
  "influenceAdvice": {
    "channels": [],
    "weeklyActions": [],
    "portfolioPackaging": []
  },
  "interviewAdvice": {
    "mustPrepareTopics": [],
    "behavioral": [],
    "technical": [],
    "mockPlan": []
  },
  "marketStrategy": {
    "searchStrategy": [],
    "referralStrategy": [],
    "portfolioStrategy": [],
    "applicationRhythm": []
  },
  "riskAndConstraints": {
    "constraints": [],
    "risks": [],
    "mitigations": []
  }
}
```

### 分析原则

- 结论可操作：每个差距都要能映射到一个训练动作或作品集项目。
- 以证据为中心：尽量基于经历中的事实与可量化成果给出判断。
- 先重要后次要：把“影响最大且最短可补齐”的项排在前面。

### 重点分析维度（务必覆盖）

- 个人信息：完整性/一致性/可信度（时间线、职位与职责、技能与项目证据是否匹配）。
- 个人成就：量化程度、归因清晰度、可验证证据（数据口径、对比基线、影响范围）。
- 证书：对目标岗位的相关性、性价比、是否能直接提升筛选通过率或面试胜率。
- 影响力：GitHub/博客/演讲/课程/视频课/社交媒体的“可见度 + 持续性 + 复用”。
- 作品集：至少给出 2-3 个“可展示”的项目/作品方向，并写清楚验收标准与证据形态。

### 必须输出的建议类型（分析后给出清单式建议）

- 简历准备建议：结构、表述、STAR/结果量化、项目案例选取与排序。
- 个人发展建议：包含“不跳槽也适用”的工作发展路线（参与什么项目、以什么身份、如何补齐经历短板）。
- 考证书建议：推荐/不推荐清单 + 理由 + 学习路径与产出。
- 专业技能提升建议：明确 3-5 个优先方向（与目标岗位强相关），并给出“项目化练习 + 证据产出 + 每周计划”。
- 语言能力提升建议：按目标地区与岗位要求，给出当前水平评估、目标水平、证据建议（考试/作品/场景），以及每周训练计划。
- 成果发布建议：发布什么、发布到哪里、频率、如何一稿多投（文章→演讲→课程→视频课→开源）。
- 影响力提升建议：渠道矩阵与每周动作（可执行、可验证）。
- 面试要领建议：常见考点、项目深挖问题、行为面试故事库与模拟训练计划。

### 开源项目（当 artifacts.type=开源项目 时）

需要重点利用并补齐以下信息（如缺失要明确写入缺失清单与补齐动作）：

- 链接（GitHub/GitLab）、简介、你承担的角色与贡献方式
- 影响力指标：Stars/Forks/下载量/使用方（若有）
- 工程质量证据：README、Demo、测试、CI、发布记录、Issue/PR 互动

### 输出质量门槛（避免“空泛”）

- 每条建议都要包含：为什么（理由）+ 做什么（动作）+ 产出物（证据）+ 验收标准（怎么判断做到了）。
- 至少给出一个“4 周可落地”的最小闭环：补齐资料 → 打磨项目/作品 → 发布 → 训练面试。
