import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true
  },
  configureServer(server) {
    server.middlewares.use('/api/analyze', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        return
      }

      try {
        const repoRoot = path.resolve(__dirname, '..')
        const inputsDir = path.join(repoRoot, 'work', 'inputs')
        const outputsDir = path.join(repoRoot, 'work', 'outputs')

        async function readJson(file: string) {
          const filePath = path.join(inputsDir, file)
          try {
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw)
          } catch {
            return null
          }
        }

        const profile = (await readJson('profile.json')) ?? {}
        const education = (await readJson('education.json')) ?? { items: [] }
        const experience = (await readJson('experience.json')) ?? { items: [] }
        const projects = (await readJson('projects.json')) ?? { items: [] }
        const artifacts = (await readJson('artifacts.json')) ?? { items: [] }
        const awards = (await readJson('awards.json')) ?? { items: [] }
        const certificates = (await readJson('certificates.json')) ?? { items: [] }
        const socialMedia = (await readJson('social_media.json')) ?? { items: [] }
        const strengths = (await readJson('strengths.json')) ?? { items: [] }
        const weaknesses = (await readJson('weaknesses.json')) ?? { items: [] }
        const skills = (await readJson('skills.json')) ?? { items: [] }
        const languages = (await readJson('languages.json')) ?? { items: [] }
        const hashtag = (await readJson('hashtag.json')) ?? { selected: [], categories: [] }
        const goals = (await readJson('goals.json')) ?? {}
        const constraints = (await readJson('constraints.json')) ?? {}
        const jobIntent = (await readJson('job_intent.json')) ?? { items: [] }
        const personality = (await readJson('personality.json')) ?? { items: [] }

        const now = new Date().toISOString()

        function truthyString(v: unknown) {
          return typeof v === 'string' && v.trim().length > 0
        }

        function num(v: unknown) {
          return typeof v === 'number' && Number.isFinite(v) ? v : null
        }

        const targetRole = String(goals?.targetRole ?? '').trim()
        const timeWindow = String(goals?.timeWindow ?? '').trim()
        const successCriteria = String(goals?.successCriteria ?? '').trim()
        const industries = Array.isArray(goals?.industries) ? goals.industries.filter((x: any) => typeof x === 'string' && x.trim()) : []
        const salaryExpectation = String(goals?.salaryExpectation ?? '').trim()

        const smartChecks = [
          { key: 'S', name: '具体（Specific）', pass: targetRole.length > 0 },
          { key: 'M', name: '可衡量（Measurable）', pass: /\d/.test(successCriteria) || /(次|家|周|月|k|w|万|%)/i.test(successCriteria) },
          { key: 'A', name: '可达成（Achievable）', pass: timeWindow.length > 0 && successCriteria.length > 0 },
          { key: 'R', name: '相关（Relevant）', pass: targetRole.length > 0 },
          { key: 'T', name: '有时限（Time-bound）', pass: timeWindow.length > 0 }
        ]
        const smartScore = smartChecks.filter((c) => c.pass).length

        const hoursPerWeek = num(constraints?.hoursPerWeek)
        const feasibility = (() => {
          if (!targetRole) return { status: 'risky', score: 1, reasons: ['目标岗位未填写'] }
          if (!timeWindow) return { status: 'risky', score: 1, reasons: ['时间窗口未填写'] }
          if (hoursPerWeek == null) return { status: 'unknown', score: 3, reasons: ['每周可投入时间未知'] }
          if (hoursPerWeek >= 10) return { status: 'likely', score: 5, reasons: ['每周可投入时间充足'] }
          if (hoursPerWeek >= 5) return { status: 'possible', score: 4, reasons: ['每周可投入时间中等'] }
          return { status: 'risky', score: 2, reasons: ['每周可投入时间偏少'] }
        })()

        const profileBasics = profile?.basics ?? {}
        const missingProfileFields = [
          !truthyString(profileBasics?.name) ? '姓名' : null,
          !truthyString(profileBasics?.currentTitle) ? '当前岗位' : null,
          !truthyString(profileBasics?.location) ? '所在城市' : null,
          num(profileBasics?.yearsOfExperience) == null ? '工作年限' : null
        ].filter(Boolean)

        const selectedTags = Array.isArray(hashtag?.selected) ? hashtag.selected : []
        const hasStrengths = Array.isArray(strengths?.items) ? strengths.items.length > 0 : false
        const hasWeaknesses = Array.isArray(weaknesses?.items) ? weaknesses.items.length > 0 : false

        const consistencyIssues: string[] = []
        if (hasStrengths && !hasWeaknesses) consistencyIssues.push('已填写长处但未填写短处')
        if (!hasStrengths && hasWeaknesses) consistencyIssues.push('已填写短处但未填写长处')
        if (selectedTags.length === 0) consistencyIssues.push('未设置个人标签（定位信息不足）')
        if (Array.isArray(skills?.items) && skills.items.length === 0) consistencyIssues.push('未填写技能清单')
        if (Array.isArray(projects?.items) && projects.items.length === 0) consistencyIssues.push('未填写项目（难以支撑目标岗位的证据）')

        const domains = [
          {
            domain: '技能',
            ok: Array.isArray(skills?.items) && skills.items.length > 0,
            recommendations: ['补齐技能清单，并标注熟练度与证据（项目/成果）']
          },
          {
            domain: '项目与作品',
            ok: (Array.isArray(projects?.items) && projects.items.length > 0) || (Array.isArray(artifacts?.items) && artifacts.items.length > 0),
            recommendations: ['至少准备 2-3 个可展示项目/作品，并补齐链接与可量化成果']
          },
          {
            domain: '就职履历',
            ok: Array.isArray(experience?.items) && experience.items.length > 0,
            recommendations: ['补齐就职履历：公司/职位/时间/亮点（尽量量化）']
          },
          {
            domain: '教育与证书',
            ok: (Array.isArray(education?.items) && education.items.length > 0) || (Array.isArray(certificates?.items) && certificates.items.length > 0),
            recommendations: ['补齐教育信息或证书信息，用于提升可信度与筛选通过率']
          },
          {
            domain: '社交影响力',
            ok: Array.isArray(socialMedia?.items) && socialMedia.items.length > 0,
            recommendations: ['补齐社交媒体链接（GitHub/博客/LinkedIn），沉淀长期影响力']
          },
          {
            domain: '目标清晰度',
            ok: smartScore >= 4,
            recommendations: ['按 SMART 补齐目标：量化成功标准、明确时间窗口、给出行业与薪资边界']
          }
        ]

        const gapPanels = domains.map((d) => ({
          domain: d.domain,
          status: d.ok ? 'ok' : 'gap',
          summary: d.ok ? '当前信息较完整' : '存在明显缺口',
          items: d.ok ? [] : d.recommendations
        }))

        const analysis = {
          generatedAt: now,
          goalPanel: {
            smart: {
              score: smartScore,
              checks: smartChecks
            },
            feasibility
          },
          personalPanel: {
            completeness: {
              missing: missingProfileFields,
              hints: [
                (Array.isArray(education?.items) && education.items.length > 0) ? null : '建议补齐教育信息',
                (Array.isArray(experience?.items) && experience.items.length > 0) ? null : '建议补齐就职履历',
                hasStrengths ? null : '建议补齐长处',
                hasWeaknesses ? null : '建议补齐短处'
              ].filter(Boolean)
            },
            consistency: {
              issues: consistencyIssues
            }
          },
          gapAnalysis: {
            targetRole,
            industries,
            domains: gapPanels
          },
          inputsSnapshot: {
            hasJobIntent: Array.isArray(jobIntent?.items) && jobIntent.items.length > 0,
            personalityCount: Array.isArray(personality?.items) ? personality.items.length : 0,
            salaryExpectation,
            hoursPerWeek
          }
        }

        await fs.mkdir(outputsDir, { recursive: true })
        await fs.writeFile(path.join(outputsDir, 'analysis.json'), JSON.stringify(analysis, null, 2), 'utf-8')

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(analysis))
      } catch (e: any) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Analyze failed', message: String(e?.message ?? e) }))
      }
    })
  }
})
