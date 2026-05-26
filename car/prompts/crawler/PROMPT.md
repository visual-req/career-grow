## /car:crawler

读取 `work/inputs/goals.json`（目标设定）与 `work/inputs/job_intent.json`（求职意向，可选），生成岗位候选列表到 `work/outputs/job_candidates.json`。

### 输入

- `work/inputs/goals.json`
- `work/inputs/job_intent.json`（可选）

### 输出

写入 `work/outputs/job_candidates.json`，建议结构：

```json
{
  "generatedAt": "",
  "query": {
    "items": [
      {
        "industry": "",
        "role": "",
        "salary": ""
      }
    ]
  },
  "items": [
    {
      "source": "",
      "title": "",
      "company": "",
      "salary": "",
      "location": "",
      "url": "",
      "tags": [],
      "updatedAt": ""
    }
  ]
}
```

### 约束

- 遵守网站条款与 robots；如需登录/验证码/接口鉴权，应提示改用“导出 CSV/手动粘贴/官方 API”。
- 默认不保存或展示敏感信息（cookie、token、账号）。
