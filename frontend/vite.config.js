import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'car-analyze-api',
      configureServer(server) {
        function safeJsonName(name) {
          if (typeof name !== 'string') return null
          if (!/^[a-zA-Z0-9_.-]+\.json$/.test(name)) return null
          if (name.includes('..') || name.includes('/') || name.includes('\\')) return null
          return name
        }

        async function readBody(req) {
          const chunks = []
          for await (const c of req) chunks.push(c)
          return Buffer.concat(chunks).toString('utf-8')
        }

        async function readJsonFile(filePath, fallback) {
          try {
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw)
          } catch {
            return fallback
          }
        }

        function parseGitHubRepoFromUrl(input) {
          const raw = String(input ?? '').trim()
          if (!raw) return null
          let u = null
          try {
            u = new URL(raw)
          } catch {
            return null
          }
          if (u.hostname !== 'github.com') return null
          const parts = u.pathname.split('/').filter(Boolean)
          if (parts.length < 2) return null
          const owner = parts[0]
          const repo = parts[1].replace(/\.git$/, '')
          if (!owner || !repo) return null
          return { owner, repo }
        }

        async function getGitHubRepo(owner, repo) {
          const options = {
            method: 'GET',
            headers: {
              'User-Agent': 'my-career',
              Accept: 'application/vnd.github+json'
            }
          }
          const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
          return new Promise((resolve, reject) => {
            const req = https.request(url, options, (resp) => {
              const chunks = []
              resp.on('data', (c) => chunks.push(c))
              resp.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8')
                if (resp.statusCode && resp.statusCode >= 400) {
                  reject(new Error(`GitHub API ${resp.statusCode}: ${body}`))
                  return
                }
                try {
                  resolve(JSON.parse(body))
                } catch (e) {
                  reject(e)
                }
              })
            })
            req.on('error', reject)
            req.end()
          })
        }

        server.middlewares.use('/api/github-repo', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Method Not Allowed' }))
            return
          }

          try {
            const urlStr = new URL(String(req.url ?? ''), 'http://localhost').searchParams.get('url')
            const parsed = parseGitHubRepoFromUrl(urlStr)
            if (!parsed) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid GitHub url' }))
              return
            }
            const data = await getGitHubRepo(parsed.owner, parsed.repo)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                fullName: data?.full_name ?? '',
                name: data?.name ?? '',
                description: data?.description ?? '',
                stars: data?.stargazers_count ?? 0,
                forks: data?.forks_count ?? 0,
                url: data?.html_url ?? ''
              })
            )
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Fetch failed', message: String(e?.message ?? e) }))
          }
        })

        server.middlewares.use('/api/inputs', async (req, res) => {
          const repoRoot = path.resolve(__dirname, '..')
          const inputsDir = path.join(repoRoot, 'work', 'inputs')
          const outputsDir = path.join(repoRoot, 'work', 'outputs')
          void outputsDir

          const name = safeJsonName(decodeURIComponent(String(req.url ?? '').replace(/^\//, '').split('?')[0] ?? ''))
          if (!name) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Invalid file name' }))
            return
          }

          const filePath = path.join(inputsDir, name)
          if (req.method === 'GET') {
            const data = await readJsonFile(filePath, null)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            try {
              const raw = await readBody(req)
              const data = raw ? JSON.parse(raw) : null
              await fs.mkdir(inputsDir, { recursive: true })
              await fs.writeFile(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8')
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Bad Request', message: String(e?.message ?? e) }))
            }
            return
          }
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        })

        server.middlewares.use('/api/outputs', async (req, res) => {
          const repoRoot = path.resolve(__dirname, '..')
          const outputsDir = path.join(repoRoot, 'work', 'outputs')
          const name = safeJsonName(decodeURIComponent(String(req.url ?? '').replace(/^\//, '').split('?')[0] ?? ''))
          if (!name) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Invalid file name' }))
            return
          }

          const filePath = path.join(outputsDir, name)
          if (req.method === 'GET') {
            const data = await readJsonFile(filePath, null)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            try {
              const raw = await readBody(req)
              const data = raw ? JSON.parse(raw) : null
              await fs.mkdir(outputsDir, { recursive: true })
              await fs.writeFile(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8')
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Bad Request', message: String(e?.message ?? e) }))
            }
            return
          }
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        })

        server.middlewares.use('/api/artifacts', async (req, res) => {
          const repoRoot = path.resolve(__dirname, '..')
          const artifactsDir = path.join(repoRoot, 'work', 'artifacts')
          const name = safeJsonName(decodeURIComponent(String(req.url ?? '').replace(/^\//, '').split('?')[0] ?? ''))
          if (!name) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Invalid file name' }))
            return
          }
          const filePath = path.join(artifactsDir, name)
          if (req.method === 'GET') {
            const data = await readJsonFile(filePath, null)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return
          }
          if (req.method === 'POST' || req.method === 'PUT') {
            try {
              const raw = await readBody(req)
              const data = raw ? JSON.parse(raw) : null
              await fs.mkdir(artifactsDir, { recursive: true })
              await fs.writeFile(filePath, JSON.stringify(data ?? null, null, 2), 'utf-8')
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Bad Request', message: String(e?.message ?? e) }))
            }
            return
          }
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        })

        server.middlewares.use('/api/crawl', async (req, res) => {
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
            const artifactsDir = path.join(repoRoot, 'work', 'artifacts')

            const goals = (await readJsonFile(path.join(inputsDir, 'goals.json'), {})) ?? {}
            const jobIntent = (await readJsonFile(path.join(inputsDir, 'job_intent.json'), { items: [] })) ?? { items: [] }

            const hasIntent = Array.isArray(jobIntent?.items) && jobIntent.items.some((x) => String(x?.targetRole ?? '').trim())
            if (!hasIntent) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(
                JSON.stringify({
                  code: 'MISSING_JOB_INTENT',
                  error: 'Missing job intent',
                  message: '请先填写求职意向（目标岗位/方向）',
                  missing: ['jobIntent.targetRole']
                })
              )
              return
            }

            const goalItems = Array.isArray(goals?.items) ? goals.items : []
            const hasGoalQuery = goalItems.some((g) => String(g?.industry ?? '').trim() || String(g?.role ?? '').trim())
            if (!hasGoalQuery) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(
                JSON.stringify({
                  code: 'MISSING_GOAL_ITEMS',
                  error: 'Missing goal items',
                  message: '请先在「目标 → 目标设定」填写至少 1 条目标条目（行业/岗位/薪资）',
                  missing: ['goals.items']
                })
              )
              return
            }

            res.statusCode = 501
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                code: 'CRAWLER_NOT_IMPLEMENTED',
                error: 'Crawler not implemented',
                message:
                  '已移除示例数据。由于 Boss 直聘等平台通常有反爬机制与使用条款限制，本项目不内置直接抓取实现。建议改用：手动打开官网搜索→复制岗位链接与 JD→粘贴/导入到候选岗位列表。',
                missing: []
              })
            )
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Crawl failed', message: String(e?.message ?? e) }))
          }
        })

        server.middlewares.use('/api/analyze', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Method Not Allowed' }))
            return
          }

          const toIsoWithOffset = (d) => {
            const pad = (n) => String(n).padStart(2, '0')
            const y = d.getFullYear()
            const m = pad(d.getMonth() + 1)
            const day = pad(d.getDate())
            const hh = pad(d.getHours())
            const mm = pad(d.getMinutes())
            const ss = pad(d.getSeconds())
            const offMin = -d.getTimezoneOffset()
            const sign = offMin >= 0 ? '+' : '-'
            const abs = Math.abs(offMin)
            const offH = pad(Math.floor(abs / 60))
            const offM = pad(abs % 60)
            return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`
          }

          const requestAtUtc = new Date().toISOString()
          const requestAtLocal = toIsoWithOffset(new Date())
          let stage = 'init'
          try {
            const repoRoot = path.resolve(__dirname, '..')
            const inputsDir = path.join(repoRoot, 'work', 'inputs')
            const outputsDir = path.join(repoRoot, 'work', 'outputs')
            const artifactsDir = path.join(repoRoot, 'work', 'artifacts')

            async function readJson(file) {
              const filePath = path.join(inputsDir, file)
              return readJsonFile(filePath, null)
            }

            stage = 'read_inputs'
            const profile = (await readJson('profile.json')) ?? {}
            const education = (await readJson('education.json')) ?? { items: [] }
            const experience = (await readJson('experience.json')) ?? { items: [] }
            const projects = (await readJson('projects.json')) ?? { items: [] }
            const artifacts = (await readJson('artifacts.json')) ?? { items: [] }
            const awards = (await readJson('awards.json')) ?? { items: [] }
            const honors = (await readJson('honors.json')) ?? { items: [] }
            const achievements = (await readJson('achievements.json')) ?? { items: [] }
            const certificates = (await readJson('certificates.json')) ?? { items: [] }
            const socialMedia = (await readJson('social_media.json')) ?? { items: [] }
            const strengths = (await readJson('strengths.json')) ?? { items: [] }
            const weaknesses = (await readJson('weaknesses.json')) ?? { items: [] }
            const skills = (await readJson('skills.json')) ?? { items: [] }
            const tools = (await readJson('tools.json')) ?? { items: [] }
            const languages = (await readJson('languages.json')) ?? { items: [] }
            const hashtag = (await readJson('hashtag.json')) ?? { selected: [] }
            const goals = (await readJson('goals.json')) ?? {}
            const constraints = (await readJson('constraints.json')) ?? {}
            const jobIntent = (await readJson('job_intent.json')) ?? { items: [] }
            const personality = (await readJson('personality.json')) ?? { items: [] }
            const verification = (await readJson('verification.json')) ?? {}

            const now = requestAtLocal
            const nowUtc = requestAtUtc

            function truthyString(v) {
              return typeof v === 'string' && v.trim().length > 0
            }

            function num(v) {
              return typeof v === 'number' && Number.isFinite(v) ? v : null
            }

            const profileBasics = profile?.basics ?? {}
            const profileFamily = profile?.family ?? {}

            const goalItems = Array.isArray(goals?.items) ? goals.items : []
            const roles = goalItems.map((x) => String(x?.role ?? '').trim()).filter(Boolean)
            const industries = goalItems.map((x) => String(x?.industry ?? '').trim()).filter(Boolean)
            const salaries = goalItems.map((x) => String(x?.salary ?? '').trim()).filter(Boolean)
            const targetRole = roles.join(' / ')
            const timeWindow = String(goals?.timeWindow ?? '').trim()
            const successCriteria = String(goals?.successCriteria ?? '').trim()
            const salaryExpectation = salaries.join(' / ')

            const salaryGapPanel = (() => {
              stage = 'salary_gap'
              const expItems = Array.isArray(experience?.items) ? experience.items : []
              const parseMonth = (s) => {
                const raw = String(s ?? '').trim()
                if (!raw) return NaN
                const m = raw.match(/^(\d{4})-(\d{2})/)
                if (!m) return NaN
                const y = Number(m[1])
                const mm = Number(m[2])
                if (!Number.isFinite(y) || !Number.isFinite(mm)) return NaN
                return y * 100 + mm
              }
              const latest = expItems
                .map((x) => ({ x, endKey: parseMonth(x?.end) || parseMonth(x?.start) }))
                .sort((a, b) => (b.endKey || 0) - (a.endKey || 0))[0]?.x
              const currentMonthlySalary =
                latest && typeof latest?.monthlySalary === 'number' && Number.isFinite(latest.monthlySalary) ? latest.monthlySalary : null

              const parseSalaryToK = (s) => {
                const raw = String(s ?? '').trim()
                if (!raw) return null
                const m = raw.match(/(\d+(\.\d+)?)/)
                if (!m) return null
                const n = Number(m[1])
                if (!Number.isFinite(n)) return null
                const baseK = /万|w/i.test(raw) ? n * 10 : /k/i.test(raw) ? n : n
                if (/年|\/y|year/i.test(raw)) return Number((baseK / 12).toFixed(1))
                return baseK
              }
              const targetMonthlySalaryK = parseSalaryToK(salaryExpectation)

              const gapK =
                currentMonthlySalary != null && targetMonthlySalaryK != null ? Number((targetMonthlySalaryK - currentMonthlySalary).toFixed(1)) : null

              const assessment =
                gapK == null
                  ? '信息不足：请在就职履历填写月薪，并在目标条目填写目标薪资（如 30k/3w/3万）'
                  : gapK <= 0
                    ? '当前薪资已达到或超过目标薪资区间（仍建议结合岗位要求与成长空间综合判断）'
                    : `目标月薪与当前月薪差距约 ${gapK}k（按目标 ${targetMonthlySalaryK}k - 当前 ${currentMonthlySalary}k 估算）`

              const recommendations = gapK == null ? [] : gapK <= 0 ? ['把优势转成可量化成果与岗位匹配证据，争取更高档位或更优权益'] : [
                    '用能力映射表锁定 3 个最大能力差距，优先做项目化补齐并形成证据（作品/复盘/指标）',
                    '准备谈薪策略：现薪→期望→理由（市场对标/能力证据/贡献预期）与底线/备选方案',
                    '补齐“可证明的成果”：提升面试通过率与议价空间（影响范围、指标提升、成本节省）'
                  ]

              return {
                currentMonthlySalaryK: currentMonthlySalary,
                targetMonthlySalaryText: salaryExpectation,
                targetMonthlySalaryK,
                gapK,
                assessment,
                recommendations
              }
            })()

            const missingProfileFields = [
              !truthyString(profileBasics?.name) ? '姓名' : null,
              !truthyString(profileBasics?.currentTitle) ? '当前岗位' : null,
              !truthyString(profileBasics?.location) ? '所在城市' : null,
              num(profileBasics?.yearsOfExperience) == null ? '工作年限' : null,
              goalItems.length === 0 ? '目标条目（行业/岗位/薪资）' : null,
              !truthyString(timeWindow) ? '时间窗口' : null,
              !truthyString(successCriteria) ? '成功标准' : null
            ].filter(Boolean)

            const completenessBlocked = missingProfileFields.length > 0

            const smartChecks = completenessBlocked
              ? []
              : [
                  { key: 'S', name: '具体（Specific）', pass: targetRole.length > 0 },
                  { key: 'M', name: '可衡量（Measurable）', pass: /\d/.test(successCriteria) || /(次|家|周|月|k|w|万|%)/i.test(successCriteria) },
                  { key: 'A', name: '可达成（Achievable）', pass: timeWindow.length > 0 && successCriteria.length > 0 },
                  { key: 'R', name: '相关（Relevant）', pass: targetRole.length > 0 },
                  { key: 'T', name: '有时限（Time-bound）', pass: timeWindow.length > 0 }
                ]
            const smartScore = smartChecks.filter((c) => c.pass).length

            const hoursPerWeek = num(constraints?.hoursPerWeek)
            const feasibility = completenessBlocked
              ? null
              : (() => {
                  if (!targetRole) return { status: 'risky', score: 1, reasons: ['目标岗位未填写'] }
                  if (!timeWindow) return { status: 'risky', score: 1, reasons: ['时间窗口未填写'] }
                  if (hoursPerWeek == null) return { status: 'unknown', score: 3, reasons: ['每周可投入时间未知'] }
                  if (hoursPerWeek >= 10) return { status: 'likely', score: 5, reasons: ['每周可投入时间充足'] }
                  if (hoursPerWeek >= 5) return { status: 'possible', score: 4, reasons: ['每周可投入时间中等'] }
                  return { status: 'risky', score: 2, reasons: ['每周可投入时间偏少'] }
                })()

            const selectedTags = Array.isArray(hashtag?.selected) ? hashtag.selected : []
            const hasStrengths = Array.isArray(strengths?.items) ? strengths.items.length > 0 : false
            const hasWeaknesses = Array.isArray(weaknesses?.items) ? weaknesses.items.length > 0 : false

            const consistencyIssues = []
            if (hasStrengths && !hasWeaknesses) consistencyIssues.push('已填写长处但未填写短处')
            if (!hasStrengths && hasWeaknesses) consistencyIssues.push('已填写短处但未填写长处')
            if (selectedTags.length === 0) consistencyIssues.push('未设置个人标签（定位信息不足）')
            if (Array.isArray(skills?.items) && skills.items.length === 0) consistencyIssues.push('未填写技能清单')
            if (Array.isArray(projects?.items) && projects.items.length === 0) consistencyIssues.push('未填写项目（难以支撑目标岗位的证据）')
            if (Array.isArray(honors?.items) && honors.items.length === 0) consistencyIssues.push('未填写荣誉信息（可提升可信度）')
            if (Array.isArray(achievements?.items) && achievements.items.length === 0) consistencyIssues.push('未填写成就信息（建议补齐可量化成果）')

            const domains = completenessBlocked
              ? []
              : [
                  { domain: '技能', ok: Array.isArray(skills?.items) && skills.items.length > 0, recommendations: ['补齐技能清单，并标注熟练度与证据（项目/成果）'] },
                  {
                    domain: '项目与作品',
                    ok: (Array.isArray(projects?.items) && projects.items.length > 0) || (Array.isArray(artifacts?.items) && artifacts.items.length > 0),
                    recommendations: ['至少准备 2-3 个可展示项目/作品，并补齐链接与可量化成果']
                  },
                  { domain: '就职履历', ok: Array.isArray(experience?.items) && experience.items.length > 0, recommendations: ['补齐就职履历：公司/职位/时间/亮点（尽量量化）'] },
                  {
                    domain: '教育与证书',
                    ok: (Array.isArray(education?.items) && education.items.length > 0) || (Array.isArray(certificates?.items) && certificates.items.length > 0),
                    recommendations: ['补齐教育信息或证书信息，用于提升可信度与筛选通过率']
                  },
                  { domain: '社交影响力', ok: Array.isArray(socialMedia?.items) && socialMedia.items.length > 0, recommendations: ['补齐社交媒体链接（GitHub/博客/LinkedIn），沉淀长期影响力'] },
                  { domain: '目标清晰度', ok: smartScore >= 4, recommendations: ['按 SMART 补齐目标：量化成功标准、明确时间窗口、给出行业与薪资边界'] }
                ]

            const gapPanels = domains.map((d) => ({
              domain: d.domain,
              status: d.ok ? 'ok' : 'gap',
              summary: d.ok ? '当前信息较完整' : '存在明显缺口',
              items: d.ok ? [] : d.recommendations
            }))

            const artifactInsights = (() => {
              stage = 'artifact_insights'
              const items = Array.isArray(artifacts?.items) ? artifacts.items : []
              const normalizeType = (t) => String(t ?? '').trim()
              const kind = (t) => {
                const s = normalizeType(t)
                if (/开源/i.test(s)) return '开源项目'
                if (/图书|书/i.test(s)) return '图书'
                if (/国标|国家标准/i.test(s)) return '国标'
                if (/行标|行业标准/i.test(s)) return '行标'
                if (/团体标准/i.test(s)) return '团体标准'
                if (/企业规范|规范/i.test(s)) return '企业规范'
                return ''
              }
              const analyzeOne = (it) => {
                const name = String(it?.name ?? '').trim()
                const type = normalizeType(it?.type)
                const k = kind(type)
                if (!k) return null
                const link = String(it?.link ?? '').trim()
                const note = String(it?.note ?? '').trim()
                const participation = String(it?.participation ?? '').trim()
                const contribution = String(it?.contribution ?? '').trim()
                const primaryAuthor = String(it?.primaryAuthor ?? '').trim()
                const coAuthors = String(it?.coAuthors ?? '').trim()
                const isbn = String(it?.isbn ?? '').trim()
                const isEbook = String(it?.isEbook ?? '').trim()
                const publisher = String(it?.publisher ?? '').trim()
                const publishDate = String(it?.publishDate ?? '').trim()
                const printCount = it?.printCount
                if (k === '开源项目') {
                  return {
                    id: it?.id ?? '',
                    name,
                    type,
                    category: '开源项目',
                    summary: [
                      name ? `项目：${name}` : null,
                      link ? `链接：${link}` : '建议补齐仓库链接（GitHub/GitLab 等）',
                      contribution ? `贡献方式：${contribution}` : '建议补齐贡献方式（PR/Issue/维护/发布/文档/测试等）',
                      '建议补齐：你负责的模块/贡献方式（PR/Issue/维护/发布）、技术栈、Stars/Forks/下载量等影响力指标',
                      '建议补齐：可复现的成果证据（Demo/文档/测试覆盖率/CI 状态）'
                    ].filter(Boolean),
                    risks: [
                      '注意：不要公开敏感信息（账号、token、公司源码）',
                      note ? `备注：${note}` : null
                    ].filter(Boolean)
                  }
                }
                return {
                  id: it?.id ?? '',
                  name,
                  type,
                  category: k,
                  summary: [
                    name ? `${k}：${name}` : `${k}：未命名`,
                    link ? `链接：${link}` : '建议补齐链接/索引（ISBN/DOI/标准号/发布页面）',
                    participation ? `参与方式：${participation}` : '建议补齐参与方式（主编/编委/起草人/参与起草/审查/参编等）',
                    k === '图书' && primaryAuthor ? `主作者：${primaryAuthor}` : null,
                    k === '图书' && coAuthors ? `其他作者：${coAuthors}` : null,
                    k === '图书' && isbn ? `ISBN：${isbn}` : null,
                    k === '图书' && isEbook ? `电子书：${isEbook === 'yes' ? '是' : isEbook === 'no' ? '否' : '未知'}` : null,
                    k === '图书' && publisher ? `出版社：${publisher}` : null,
                    k === '图书' && publishDate ? `出版日期：${publishDate}` : null,
                    k === '图书' && (typeof printCount === 'number' || typeof printCount === 'string') && String(printCount).trim()
                      ? `印刷数量：${String(printCount).trim()}`
                      : null,
                    '建议补齐：你承担的角色、贡献边界、影响范围（引用/采纳/用户数/落地案例）',
                    '建议补齐：可验证证据（出版信息、标准号、发布机构、发布时间）'
                  ].filter(Boolean)
                }
              }
              const out = items.map(analyzeOne).filter(Boolean)
              return out.length ? out : null
            })()

            const jobIntentFirst = Array.isArray(jobIntent?.items) && jobIntent.items.length > 0 ? jobIntent.items[0] : {}
            const intentLocation = String(jobIntentFirst?.location ?? '').trim()
            const geoText = `${intentLocation} ${String(constraints?.geoAndMode ?? '').trim()} ${String(goals?.geoPreference ?? '').trim()}`.trim()
            const isJapanTarget = /日本|Japan|东京|大阪|名古屋|福冈|札幌|横滨/i.test(geoText)

            const languageNames = Array.isArray(languages?.items) ? languages.items.map((x) => String(x?.name ?? '').trim()) : []
            const hasJapanese = languageNames.some((n) => /日语|Japanese/i.test(n))

            function toZhStatus(s) {
              const v = String(s ?? '').trim()
              const map = {
                ok: '通过',
                gap: '有缺口',
                review: '需评估',
                unknown: '未知',
                likely: '很可能',
                possible: '可能',
                unlikely: '不太可能'
              }
              return map[v] ?? v
            }

            const maritalStatus = String(profileBasics?.maritalStatus ?? 'unknown').trim() || 'unknown'
            const birthMonth = String(profileBasics?.birthMonth ?? '').trim()
            const childrenBirthMonths = Array.isArray(profileFamily?.childrenBirthMonths) ? profileFamily.childrenBirthMonths.map((x) => String(x ?? '').trim()).filter(Boolean) : []
            const fatherBirthMonth = String(profileFamily?.parents?.fatherBirthMonth ?? '').trim()
            const motherBirthMonth = String(profileFamily?.parents?.motherBirthMonth ?? '').trim()
            const fatherHasPension = String(profileFamily?.parents?.fatherHasPension ?? 'unknown')
            const motherHasPension = String(profileFamily?.parents?.motherHasPension ?? 'unknown')
            const socialSecurityYears = num(profileFamily?.socialSecurityYears)

            const valueFactors = []
            if (isJapanTarget) {
              valueFactors.push({
                key: 'fx',
                title: '汇率与实际收入',
                status: '需评估',
                notes: ['若收入以日元计价，汇率波动会影响折算到人民币的实际购买力', '需要明确：工资结构（基本/奖金/补贴）与生活成本（房租/通勤/税费）']
              })
              valueFactors.push({
                key: 'lang',
                title: '语言与融入成本',
                status: hasJapanese ? '通过' : '有缺口',
                notes: hasJapanese ? ['已填写日语能力，可进一步明确水平与证据（证书/面试表现）'] : ['未填写日语能力，建议补齐（日语等级/口语）并考虑面试语言要求']
              })
              valueFactors.push({
                key: 'visa',
                title: '签证/工作许可与合规',
                status: '需评估',
                notes: ['确认签证路径（公司担保/高度人才/留学转工签等）与时间成本', '确认学历/经验门槛与材料要求']
              })
            }

            valueFactors.push({
              key: 'age',
              title: '年龄与职级匹配',
              status: birthMonth ? '需评估' : '未知',
              notes:
                birthMonth
                  ? ['部分岗位对年龄/资历有隐性筛选，建议明确目标职级与叙事（管理/专家路径）', `出生年月：${birthMonth}`]
                  : ['未填写出生年月，建议补齐以评估岗位/职级/签证与家庭规划的影响']
            })

            valueFactors.push({
              key: 'family',
              title: '婚姻/子女与迁移成本',
              status: maritalStatus === 'unknown' ? '未知' : maritalStatus === 'married' && childrenBirthMonths.length > 0 ? '需评估' : '通过',
              notes: [
                maritalStatus === 'unknown' ? '未填写婚否，建议补齐（涉及迁移/稳定性/家庭支持）' : null,
                childrenBirthMonths.length === 0 ? '未填写子女出生年月（如无子女可保持为空）' : `子女出生年月：${childrenBirthMonths.join('、')}`
              ].filter(Boolean)
            })

            valueFactors.push({
              key: 'parents',
              title: '父母赡养与保障',
              status: !fatherBirthMonth && !motherBirthMonth ? '未知' : '需评估',
              notes: [
                fatherBirthMonth ? `父亲出生年月：${fatherBirthMonth}` : '父亲出生年月未知',
                motherBirthMonth ? `母亲出生年月：${motherBirthMonth}` : '母亲出生年月未知',
                `父亲退休金：${fatherHasPension === 'yes' ? '有' : fatherHasPension === 'no' ? '无' : '未知'}`,
                `母亲退休金：${motherHasPension === 'yes' ? '有' : motherHasPension === 'no' ? '无' : '未知'}`
              ]
            })

            valueFactors.push({
              key: 'socialSecurity',
              title: '社保缴纳年限与保障规划',
              status: socialSecurityYears == null ? '未知' : '需评估',
              notes: [
                socialSecurityYears == null ? '未填写社保缴纳年限，建议补齐（影响医疗/购房/落户/退休累计等）' : `社保缴纳年限：${socialSecurityYears}`,
                '若涉及跨地区/跨国家流动，建议提前评估社保转移、补缴与商业保险方案'
              ].filter(Boolean)
            })

            const vTarget = verification?.target ?? {}
            const vSalary = verification?.salary ?? {}
            const vCost = verification?.cost ?? {}
            const vTax = verification?.tax ?? {}

            const verifyCity = String(vTarget?.city ?? intentLocation ?? '').trim()
            const verifyRole = String(vTarget?.role ?? '').trim() || targetRole

            const grossMinK = num(vSalary?.grossMinK)
            const grossMaxK = num(vSalary?.grossMaxK)
            const netMinK = num(vSalary?.netMinK)
            const netMaxK = num(vSalary?.netMaxK)
            const bonusMonths = num(vSalary?.bonusMonths)
            const salarySources = Array.isArray(vSalary?.sources) ? vSalary.sources.map((x) => String(x ?? '').trim()).filter(Boolean) : []

            const rentK = num(vCost?.rentK)
            const commuteK = num(vCost?.commuteK)
            const foodK = num(vCost?.foodK)
            const otherK = num(vCost?.otherK)
            const costItems = [
              rentK != null ? { key: 'rent', label: '房租', k: rentK } : null,
              commuteK != null ? { key: 'commute', label: '通勤', k: commuteK } : null,
              foodK != null ? { key: 'food', label: '餐饮', k: foodK } : null,
              otherK != null ? { key: 'other', label: '其他', k: otherK } : null
            ].filter(Boolean)
            const costTotalK = costItems.length ? Number(costItems.reduce((acc, x) => acc + Number(x.k || 0), 0).toFixed(2)) : null

            let usedNetMinK = netMinK
            let usedNetMaxK = netMaxK
            let usedNetEstimated = false
            if (usedNetMinK == null && usedNetMaxK == null && grossMinK != null && grossMaxK != null) {
              usedNetEstimated = true
              usedNetMinK = Number((grossMinK * 0.75).toFixed(1))
              usedNetMaxK = Number((grossMaxK * 0.75).toFixed(1))
            }

            const afterCostMinK = usedNetMinK != null && costTotalK != null ? Number((usedNetMinK - costTotalK).toFixed(1)) : null
            const afterCostMaxK = usedNetMaxK != null && costTotalK != null ? Number((usedNetMaxK - costTotalK).toFixed(1)) : null

            const financialIssues = []
            if (!verifyCity) financialIssues.push('未填写目标城市（验证信息）')
            if (grossMinK == null || grossMaxK == null) financialIssues.push('未填写税前主流薪资区间（验证信息）')
            if (costTotalK == null) financialIssues.push('未填写生活成本估算（验证信息）')
            const targetK = typeof salaryGapPanel?.targetMonthlySalaryK === 'number' && Number.isFinite(salaryGapPanel.targetMonthlySalaryK) ? salaryGapPanel.targetMonthlySalaryK : null
            if (targetK != null && grossMinK != null && grossMaxK != null) {
              if (targetK > grossMaxK * 1.3) financialIssues.push(`目标薪资（约 ${targetK}k/月）明显高于该城市该岗位主流区间上沿（${grossMaxK}k/月），需要用职级/岗位范围重新对齐`)
              if (targetK < grossMinK * 0.7) financialIssues.push(`目标薪资（约 ${targetK}k/月）明显低于该城市该岗位主流区间下沿（${grossMinK}k/月），建议核对口径（税前/税后、年包/月薪）`)
            }

            const financialPanel = {
              city: verifyCity,
              role: verifyRole,
              salary: {
                grossMinK,
                grossMaxK,
                netMinK: usedNetMinK,
                netMaxK: usedNetMaxK,
                netEstimated: usedNetEstimated,
                bonusMonths,
                sources: salarySources,
                notes: String(vSalary?.notes ?? '').trim()
              },
              cost: {
                items: costItems,
                totalK: costTotalK,
                notes: String(vCost?.notes ?? '').trim()
              },
              netAfterCost: {
                minK: afterCostMinK,
                maxK: afterCostMaxK
              },
              taxNotes: String(vTax?.notes ?? '').trim(),
              issues: financialIssues,
              recommendations: [
                '把“主流薪资区间”与“税后到手”拆清楚：是否含奖金/补贴/加班/期权、按 12/13/14 薪、社保公积金口径',
                '把生活成本拆到可复核：房租/通勤/餐饮/保险/一次性搬家成本，并写清假设（独居/合租、通勤方式等）',
                '用职级对齐校准：该薪资在该城市该岗位通常对应的职级（P 序列/M 序列）是什么？'
              ]
            }

            const goalValue = completenessBlocked
              ? null
              : {
                  summary: isJapanTarget
                    ? '目标包含“赴日发展”，建议把语言、汇率、签证、家庭与社保等因素显式纳入可行性与成本评估。'
                    : '建议明确目标对你的长期价值，并把关键外部因素（地域/家庭/保障/风险）纳入评估。',
                  factors: valueFactors,
                  questionsToVerify: [
                    grossMinK != null && grossMaxK != null
                      ? `目标岗位在目标地区的主流薪资区间：税前 ${grossMinK}-${grossMaxK}k/月${usedNetMinK != null && usedNetMaxK != null ? `，税后到手 ${usedNetMinK}-${usedNetMaxK}k/月${usedNetEstimated ? '（估算）' : ''}` : ''}`
                      : '目标岗位在目标地区的主流薪资区间与税后到手是多少？（去“验证信息”填写）',
                    costTotalK != null && afterCostMinK != null && afterCostMaxK != null
                      ? `生活成本估算：约 ${costTotalK}k/月，扣除后可支配净收入约 ${afterCostMinK}-${afterCostMaxK}k/月`
                      : '该地区的生活成本与汇率波动对净收入的影响如何？（去“验证信息”填写）',
                    '目标岗位对语言与学历/经验门槛是什么？你目前差多少？',
                    '家庭与社保的迁移/中断成本是否在可接受范围？'
                  ]
                }

            const ladderJumper = (() => {
              const items = Array.isArray(experience?.items) ? experience.items : []
              if (items.length === 0) return { status: '未知', score: 0, reasons: ['未填写就职履历，无法判断是否存在频繁跳槽/快速升阶现象'] }

              const toMonthIndex = (ym) => {
                const s = String(ym ?? '').trim()
                const m = s.match(/^(\d{4})-(\d{2})/)
                if (!m) return null
                const y = Number(m[1])
                const mm = Number(m[2])
                if (!Number.isFinite(y) || !Number.isFinite(mm)) return null
                return y * 12 + (mm - 1)
              }

              const now = new Date()
              const nowIdx = now.getFullYear() * 12 + now.getMonth()
              const tenures = items
                .map((it) => {
                  const s = toMonthIndex(it?.start)
                  const e = toMonthIndex(it?.end) ?? nowIdx
                  if (s == null || e == null) return null
                  return Math.max(0, e - s + 1)
                })
                .filter((x) => typeof x === 'number' && Number.isFinite(x))

              if (tenures.length === 0) return { status: '未知', score: 0, reasons: ['就职履历缺少开始/结束时间，无法计算任职时长'] }

              const shortStints = tenures.filter((m) => m <= 10).length
              const median = [...tenures].sort((a, b) => a - b)[Math.floor(tenures.length / 2)] ?? 0
              const ratio = tenures.length ? shortStints / tenures.length : 0
              const reasons = []

              if (ratio >= 0.6 && tenures.length >= 3) reasons.push('任职时长偏短的经历占比较高（可能存在频繁跳槽）')
              if (median && median <= 12 && tenures.length >= 3) reasons.push('中位任职时长 ≤ 12 个月（稳定性可能不足）')
              if (tenures.length >= 5) reasons.push('就职次数较多，建议说明每次变动的原因与收益')

              let score = 3
              if (ratio >= 0.6 && tenures.length >= 3) score += 2
              if (median && median <= 12) score += 1
              if (ratio <= 0.25 && median >= 18) score -= 2
              score = Math.max(1, Math.min(5, score))

              const status = toZhStatus(score >= 5 ? 'likely' : score >= 4 ? 'possible' : score <= 2 ? 'unlikely' : 'review')
              return {
                status,
                score,
                reasons: reasons.length ? reasons : ['从任职时长分布看，暂无明显“频繁跳槽”信号'],
                metrics: { jobCount: items.length, shortStints, medianMonths: median }
              }
            })()

            const projectsCount = Array.isArray(projects?.items) ? projects.items.length : 0
            const artifactsCount = Array.isArray(artifacts?.items) ? artifacts.items.length : 0
            const achievementsCount = Array.isArray(achievements?.items) ? achievements.items.length : 0
            const certificatesCount = Array.isArray(certificates?.items) ? certificates.items.length : 0
            void certificatesCount
            const socialCount = Array.isArray(socialMedia?.items) ? socialMedia.items.length : 0

            const resumePreparationAdvice = {
              checklist: [
                missingProfileFields.length ? `优先补齐缺失字段：${missingProfileFields.join('、')}` : null,
                !truthyString(profile?.summary) ? '补齐个人简介：2-3 句说明“我是谁/做过什么/要去哪里”' : null,
                projectsCount === 0 ? '补齐项目：至少 2-3 个可对外讲清楚的项目案例（含角色、技术、结果）' : null,
                achievementsCount === 0 ? '补齐成就：至少 3 条可量化成果（对比基线、口径、影响范围）' : null,
                artifactsCount === 0 ? '补齐作品/证明材料：开源/文章/演讲/课程/视频课/标准/论文等至少 1-2 项' : null,
                Array.isArray(skills?.items) && skills.items.length === 0 ? '补齐技能清单：每项写熟练度 + 证据（项目/成果）' : null,
                socialCount === 0 ? '补齐对外链接：GitHub/博客/知乎/掘金/LinkedIn 等' : null
              ].filter(Boolean),
              rewriteSuggestions: [
                '经历与项目用 STAR/行动-结果写法：背景 1 句 + 任务 1 句 + 动作 2-3 条 + 结果 1-2 条（尽量量化）',
                '统一口径：岗位名称、时间范围、技术栈、职责边界避免前后矛盾',
                '把“做了什么”改成“解决了什么问题 + 带来什么结果 + 如何验证”'
              ],
              projectCaseSuggestions: [
                '选择 2 个最能证明目标岗位能力的项目作为主案例：一个偏业务价值、一个偏工程能力',
                '每个主案例准备 10 分钟故事 + 3 分钟精简版 + 5 个可深挖问题的证据点（日志/指标/架构图/PR/文档）'
              ]
            }

            const workDevelopmentAdvice = (() => {
              const role = String(targetRole ?? '').trim()
              const recProjects = []
              const recRoles = ['核心贡献者（Owner）', '需求拆解/方案负责人', '交付与质量守门人']
              const targetK = typeof salaryGapPanel?.targetMonthlySalaryK === 'number' && Number.isFinite(salaryGapPanel.targetMonthlySalaryK) ? salaryGapPanel.targetMonthlySalaryK : null
              if (targetK != null) {
                if (targetK >= 80) {
                  if (/开发|后端|前端|工程师|程序/i.test(role)) recRoles.unshift('技术负责人/架构负责人（对标高薪资）')
                  else if (/产品|PM/i.test(role)) recRoles.unshift('产品负责人/增长负责人（对标高薪资）')
                  else if (/测试|QA|质量/i.test(role)) recRoles.unshift('质量负责人/测试负责人（对标高薪资）')
                  else recRoles.unshift('负责人/专家路径（对标高薪资）')
                } else if (targetK >= 60) {
                  recRoles.unshift('资深/专家路径（对标目标薪资）')
                }
              }
              if (/测试|QA|质量/i.test(role)) {
                recProjects.push('质量工程/测试平台：自动化、CI/CD 质量门禁、缺陷治理')
                recProjects.push('效率工程：覆盖率、回归时间、发布频率、故障率等指标驱动改进')
                recRoles.unshift('测试/质量负责人（模块 Owner）')
              } else if (/产品|PM/i.test(role)) {
                recProjects.push('增长/用户体验项目：指标体系 + 实验迭代 + 复盘闭环')
                recProjects.push('平台化项目：把重复劳动产品化（权限、配置、工作流、数据看板）')
                recRoles.unshift('产品负责人（模块 Owner）')
              } else if (/咨询|顾问|交付/i.test(role)) {
                recProjects.push('咨询交付项目：问题定义→方案→落地→复盘（可量化收益）')
                recProjects.push('流程/组织改进：敏捷/DevOps/质量体系落地与指标治理')
                recRoles.unshift('方案/交付负责人')
              } else {
                recProjects.push('平台/工程化项目：从 0 到 1 建立可复用能力（组件库/脚手架/自动化/可观测）')
                recProjects.push('跨团队协作项目：推动标准化、治理与规模化落地（指标/流程/工具）')
              }

              const upgrade = [
                '主动争取“可讲故事”的任务：跨部门协作、关键链路、核心指标、故障/质量治理',
                '把经历变成证据：形成 PR/文档/复盘/指标看板/演讲稿（可对外展示的版本）',
                '每季度至少沉淀 1 个可复用资产：模板/工具/规范/开源仓库/课程或视频课'
              ]
              const skillPlan = [
                hoursPerWeek == null ? '先量化每周可投入时间（学习/项目/复盘/输出）' : `按每周可投入 ${hoursPerWeek} 小时规划：2/3 做项目，1/3 做沉淀与输出`,
                '每月明确 1 个主题能力：例如架构/质量/数据/交付/沟通影响力，并用项目产出验证',
                '建立技能-证据映射表：每个技能对应一个项目证据点（结果/链接/截图/指标）'
              ]

              return {
                evenIfNoJobHopping: true,
                recommendedProjectTypes: recProjects,
                recommendedRoles: recRoles,
                projectExperienceUpgrade: upgrade,
                skillAccumulationPlan: skillPlan
              }
            })()

            const certificationAdvice = (() => {
              const role = String(targetRole ?? '').trim()
              const recommended = []
              const notRecommended = []
              const rationale = []
              const studyPlan = []

              const obtainedRaw = Array.isArray(certificates?.items) ? certificates.items : []
              const obtainedNames = obtainedRaw
                .map((x) => String(x?.customName ?? x?.name ?? x?.title ?? x?.cert ?? '').trim())
                .filter(Boolean)
              const hasCert = (re) => obtainedNames.some((n) => re.test(n))

              if (/敏捷|Scrum|SAFe|LeSS|交付|咨询|项目/i.test(role)) {
                if (hasCert(/CSM|PSM|CSPO|PSPO/i)) {
                  rationale.push('已具备 Scrum/敏捷类证书，可把重点放在项目实践与可验证产出上（而不是重复考证）。')
                } else {
                  recommended.push('Scrum/敏捷类证书（CSM/PSM/CSPO/PSPO，择其一）')
                  rationale.push('对交付/协作/流程类岗位的筛选与沟通有加成，且可用于方法论背书')
                }
              }
              if (/SAFe/i.test(role)) {
                if (hasCert(/SAFe/i)) {
                  rationale.push('已具备 SAFe 相关证书，可优先用“规模化敏捷落地案例 + 指标改进”来强化说服力。')
                } else {
                  recommended.push('SAFe 相关认证（如 SAFe Agilist，择其一）')
                  rationale.push('适用于大规模敏捷场景，能补齐“规模化协作/多团队节奏”叙事')
                }
              }
              if (/测试|QA|质量/i.test(role)) {
                if (hasCert(/ISTQB|CTFL|CTAL|CTEL/i)) {
                  rationale.push('已具备测试/质量相关证书，建议优先补齐质量工程实践证据（覆盖率/回归效率/缺陷率/门禁治理）。')
                } else {
                  recommended.push('测试/质量体系相关认证（按目标岗位要求选择）')
                  rationale.push('在缺少强项目证据时，证书可作为辅助背书，但不替代项目结果')
                }
              }
              notRecommended.push('与目标岗位关联弱、无法形成项目证据闭环的“堆证书”')
              studyPlan.push('先选 1 张最匹配目标岗位的证书，规划 4-6 周：学习→做项目→产出文章/分享→把证书写进项目实践')
              studyPlan.push('每周至少 1 次复盘：把证书知识点映射到真实项目案例与面试题库')

              return { recommended, notRecommended, rationale, studyPlan }
            })()

            const softSkillsPanel = (() => {
              const tags = Array.isArray(hashtag?.selected) ? hashtag.selected : []
              const tagText = tags.map((t) => String(t ?? '').replace(/^#/, '').trim()).filter(Boolean)
              const strengthsText = (Array.isArray(strengths?.items) ? strengths.items : [])
                .map((x) => String(x?.text ?? x ?? '').trim())
                .filter(Boolean)
              const weaknessesText = (Array.isArray(weaknesses?.items) ? weaknesses.items : [])
                .map((x) => String(x?.text ?? x ?? '').trim())
                .filter(Boolean)

              const all = [...tagText, ...strengthsText, ...weaknessesText].join(' / ')
              const hasAny = (re) => re.test(all)
              const picks = []
              if (hasAny(/沟通|表达|汇报|写作|对齐/i)) picks.push('沟通与表达')
              if (hasAny(/协作|跨团队|推进|对齐|协调/i)) picks.push('跨团队协作与推进')
              if (hasAny(/引导|主持|共创|工作坊|会议|facilitation/i)) picks.push('引导与会议效率')
              if (hasAny(/教练|辅导|培养|导师|coaching/i)) picks.push('教练与培养')
              if (hasAny(/谈判|博弈|议价|冲突/i)) picks.push('谈判与冲突处理')
              if (hasAny(/结果导向|自驱|owner|主人翁|负责/i)) picks.push('Owner 意识与结果导向')

              const strengthsOut = picks.length ? picks : tagText.length ? ['软技能标签已填写，但建议补齐“行为证据”'] : []
              const gaps = []
              if (!Array.isArray(strengths?.items) || strengths.items.length === 0) gaps.push('未填写长处，软技能优势不清晰')
              if (!Array.isArray(weaknesses?.items) || weaknesses.items.length === 0) gaps.push('未填写短处，软技能改进方向不清晰')
              if (!tagText.length) gaps.push('未设置软技能相关标签（影响定位与叙事）')

              const recommendations = [
                '建立“沟通产出物”模板：周报/里程碑同步/决策记录（DR）/复盘（Postmortem）',
                '每个项目至少做一次结构化复盘：问题→原因→方案→结果→后续动作，并沉淀到作品集',
                '主动承担一次跨团队推进：明确目标、干系人地图、节奏与风险清单，用可视化看板跟踪',
                '把软技能变成证据：会议纪要、共创产出、方案文档、推动记录、影响范围与反馈'
              ]

              const weeklyActions = [
                '每周 1 次：写 1 页“项目推进记录”（目标/进度/风险/决策/下一步）',
                '每周 1 次：做 1 次 10 分钟分享（组内/社区均可），练表达与结构化',
                '每周 1 次：复盘一次沟通/协作事件（冲突/推动/失败）并形成可复用话术'
              ]

              const summary = gaps.length
                ? '软技能信息与证据不足，建议先补齐长处/短处与可验证产出物。'
                : '软技能具备一定基础，建议把“能力”转成“可验证的影响力证据”，用于简历与面试。'

              return { summary, strengths: strengthsOut, gaps, recommendations, weeklyActions }
            })()

            const professionalSkillsAdvice = (() => {
              const role = String(targetRole ?? '').trim()
              const items = Array.isArray(skills?.items) ? skills.items : []
              const names = items.map((x) => String(x?.customName ?? x?.name ?? '').trim()).filter(Boolean)
              const levelMap = new Map(
                items.map((x) => [String(x?.customName ?? x?.name ?? '').trim(), String(x?.level ?? '').trim()]).filter((p) => p[0])
              )

              const hasAny = (re) => names.some((n) => re.test(n))
              const focusAreas = []
              if (/测试|QA|质量/i.test(role)) {
                if (!hasAny(/自动化|Automation|Playwright|Cypress|Selenium|Appium/i)) focusAreas.push('自动化测试与稳定性工程')
                if (!hasAny(/CI|CD|流水线|Jenkins|GitHub Actions|GitLab CI/i)) focusAreas.push('CI/CD 质量门禁与工程化')
                if (!hasAny(/指标|度量|Metrics|质量/i)) focusAreas.push('质量度量与缺陷治理')
              } else if (/产品|PM/i.test(role)) {
                focusAreas.push('指标体系与实验/复盘方法')
                focusAreas.push('需求分析与优先级/资源权衡')
              } else if (/咨询|顾问|交付/i.test(role)) {
                focusAreas.push('结构化分析与方案设计（问题定义→拆解→落地→复盘）')
                focusAreas.push('干系人管理与价值量化')
              } else {
                focusAreas.push('工程化能力（可观测/性能/稳定性/自动化）')
                focusAreas.push('系统设计与权衡（边界、数据、可靠性）')
              }

              const gaps = []
              if (items.length === 0) gaps.push('未填写技能清单，无法判断专业技能结构与深度')
              const basicSkills = items
                .filter((x) => String(x?.level ?? '').trim() === 'basic')
                .map((x) => String(x?.customName ?? x?.name ?? '').trim())
                .filter(Boolean)
              if (basicSkills.length >= 6) gaps.push('基础水平技能占比偏高，建议选 3-5 项做深做透并配套项目证据')

              const recommendations = [
                '建立“技能-证据映射表”：每个关键技能绑定 1 个项目证据（结果指标/链接/截图/文档/PR）',
                '用项目驱动学习：每次学习都要产出可验证结果（自动化覆盖率、回归时间、缺陷率、稳定性、成本/效率等）',
                '把技能写成能力叙事：我用 X 解决了 Y，带来 Z（口径与基线清晰）'
              ]

              const projectPractice = [
                '选择 1 个可复用“平台化”方向做作品：例如质量门禁/自动化框架/指标看板/工作流工具',
                '为作品设验收标准：可复现、可演示、可度量（至少 2 个指标）',
                '沉淀文档与复盘：README + 架构图 + 决策记录 + 复盘文章'
              ]

              const weeklyPlan = [
                hoursPerWeek == null ? '先量化每周可投入时间，再拆分为：项目 70% + 学习 20% + 输出 10%' : `按每周 ${hoursPerWeek} 小时：项目 70% + 学习 20% + 输出 10%`,
                '每周固定 1 次：补证据（更新作品集/链接/指标/复盘）',
                '每周固定 1 次：针对目标岗位做题/模拟（结合项目深挖问题）'
              ]

              const summary = gaps.length ? '专业技能信息不足或结构不清晰，建议先补齐技能清单并用项目证据校准。' : '专业技能可进一步通过“项目化 + 证据化”提升说服力与面试胜率。'
              return { summary, focusAreas, gaps, recommendations, projectPractice, weeklyPlan, currentSkills: names.slice(0, 30), levels: Object.fromEntries(levelMap) }
            })()

            const languageAbilityAdvice = (() => {
              stage = 'language_advice'
              const items = Array.isArray(languages?.items) ? languages.items : []
              const normalizeName = (x) => String(x?.name ?? x?.customName ?? '').trim()
              const normalizeLevel = (x) => String(x?.level ?? '').trim()
              const list = items
                .map((x) => ({ name: normalizeName(x), level: normalizeLevel(x), note: String(x?.note ?? '').trim() }))
                .filter((x) => x.name)

              const find = (re) => list.find((x) => re.test(x.name))
              const en = find(/英语|English/i)
              const jp = find(/日语|Japanese/i)

              const gaps = []
              if (isJapanTarget && !jp) gaps.push('目标包含日本，但未填写日语能力项')
              if (list.length === 0) gaps.push('未填写语言能力，无法判断外企/跨地区机会的可行性')

              const recommendations = []
              if (isJapanTarget) {
                if (!jp) {
                  recommendations.push('补齐日语能力：给出当前水平 + 目标水平 + 证据（考试/口语场景/写作）')
                  recommendations.push('设定 8-12 周语言里程碑：日常沟通→工作交流→面试场景表达')
                } else if (jp.level === 'basic') {
                  recommendations.push('日语从“基础”提升到“工作交流”：优先练面试自我介绍、项目讲解、问题澄清三类场景')
                }
              }
              if (!en) {
                recommendations.push('补齐英语能力项：至少能支撑阅读文档/写邮件/参加英文会议的描述与证据')
              } else if (en.level === 'basic') {
                recommendations.push('英语优先提升到“工作交流”：以岗位相关材料为语料（简历/项目介绍/复盘）做口语与写作训练')
              }

              const weeklyPlan = [
                '每周 3-5 次：30 分钟输入（听/读）+ 30 分钟输出（说/写）',
                '每周 1 次：准备并录制 3-5 分钟“项目英文/日文讲解”，对照脚本迭代',
                '每周 1 次：把语言学习产出写进作品集（英文 README/日文项目简介/双语简历片段）'
              ]

              const proofSuggestions = [
                '证据优先：考试成绩（如 JLPT/TOEIC/IELTS/TOEFL）、英文/日文文档/README、公开分享或课程字幕稿',
                '场景优先：自我介绍、项目讲解、冲突处理、复盘总结、需求澄清'
              ]

              const summary = gaps.length ? '语言能力信息不足或与目标地区不匹配，建议先补齐语言项与可验证证据。' : '语言能力可通过“场景化训练 + 产出物证据”提升面试与跨区域机会。'
              return { summary, current: list, gaps, recommendations, weeklyPlan, proofSuggestions }
            })()

            const capabilityMap = (() => {
              stage = 'capability_map'
              const role = String(targetRole ?? '').trim()

              const mapSkillLevel = (lvl) => {
                const v = String(lvl ?? '').trim()
                const m = { beginner: 2, intermediate: 3, proficient: 4, expert: 5 }
                return m[v] ?? 1
              }
              const mapLangLevel = (lvl) => {
                const v = String(lvl ?? '').trim()
                const m = { basic: 2, working: 3, fluent: 4, native: 5 }
                return m[v] ?? 1
              }

              const skillsItems = Array.isArray(skills?.items) ? skills.items : []
              const skillNames = skillsItems.map((x) => String(x?.customName ?? x?.name ?? '').trim()).filter(Boolean)
              const skillMax = skillsItems.reduce((acc, x) => Math.max(acc, mapSkillLevel(x?.level)), 1)

              const projectsItems = Array.isArray(projects?.items) ? projects.items : []
              const projectCaps = projectsItems
                .flatMap((p) => (Array.isArray(p?.capabilityStack) ? p.capabilityStack : []))
                .map((x) => String(x ?? '').trim())
                .filter(Boolean)
              const projectStacks = projectsItems
                .flatMap((p) => (Array.isArray(p?.techStack) ? p.techStack : []))
                .map((x) => String(x ?? '').trim())
                .filter(Boolean)
              const projectText = [...projectCaps, ...projectStacks].join(' / ')

              const languagesItems = Array.isArray(languages?.items) ? languages.items : []
              const langMax = languagesItems.reduce((acc, x) => Math.max(acc, mapLangLevel(x?.level)), 1)
              const langSummary = languagesItems
                .map((x) => `${String(x?.name ?? '').trim() || '未知'}（${String(x?.level ?? '').trim() || 'unknown'}）`)
                .filter((x) => x && !/^\s*未知/.test(x))
                .slice(0, 4)
                .join('，')

              const achievementsItems = Array.isArray(achievements?.items) ? achievements.items : []
              const achievementHasNumber = achievementsItems.some((a) => /\d|%|万|k|w/i.test(String(a?.result ?? '').trim()))

              const tags = Array.isArray(hashtag?.selected) ? hashtag.selected : []
              const tagText = tags.map((t) => String(t ?? '').replace(/^#/, '').trim()).filter(Boolean).join(' / ')
              const softText = [
                tagText,
                ...(Array.isArray(strengths?.items) ? strengths.items : []).map((x) => String(x?.text ?? x ?? '').trim()),
                ...(Array.isArray(weaknesses?.items) ? weaknesses.items : []).map((x) => String(x?.text ?? x ?? '').trim())
              ]
                .filter(Boolean)
                .join(' / ')

              const commScore = /沟通|协作|跨团队|推动|引导|谈判|教练|汇报|表达/i.test(softText) ? 4 : tags.length ? 3 : 2

              const expItems = Array.isArray(experience?.items) ? experience.items : []
              const maxManaged = expItems.reduce((acc, it) => {
                const n = Number(it?.managedCount)
                return Number.isFinite(n) ? Math.max(acc, n) : acc
              }, 0)
              const hasLeadTitle = expItems.some((it) => /负责人|主管|经理|manager|lead|head/i.test(String(it?.title ?? '').trim()))
              const mgmtScore = maxManaged >= 20 ? 5 : maxManaged >= 10 ? 4 : maxManaged >= 3 ? 3 : hasLeadTitle ? 3 : 2

              const engScore =
                /DevOps|CI|CD|Jenkins|GitHub Actions|GitLab CI|Kubernetes|Docker|云原生|SRE|可观测|监控|告警|流水线|门禁/i.test(projectText) ||
                skillNames.some((n) => /DevOps|CI|CD|Jenkins|Kubernetes|Docker|SRE|可观测/i.test(n))
                  ? 4
                  : projectsItems.length
                    ? 3
                    : 2

              const dataScore =
                achievementHasNumber || /数据分析|SQL|指标|Metrics|A\/B|实验|看板/i.test(projectText) || skillNames.some((n) => /SQL|数据|分析/i.test(n))
                  ? 4
                  : achievementsItems.length
                    ? 3
                    : 2

              const domainScore = projectsItems.some((p) => String(p?.industry ?? '').trim()) ? 3 : 2

              const artifactsItems = Array.isArray(artifacts?.items) ? artifacts.items : []
              const maxStars = artifactsItems.reduce((acc, it) => {
                if (String(it?.type ?? '').trim() !== '开源项目') return acc
                const s = Number(it?.stars)
                return Number.isFinite(s) ? Math.max(acc, s) : acc
              }, 0)
              const influenceScore = maxStars >= 200 ? 5 : maxStars >= 50 ? 4 : artifactsItems.length ? 3 : 2

              const requiredPreset = (() => {
                if (/测试|QA|质量/i.test(role)) return { tech: 4, eng: 4, domain: 3, data: 3, comm: 3, mgmt: 3, lang: 2, influence: 3 }
                if (/产品|PM/i.test(role)) return { tech: 3, eng: 3, domain: 4, data: 4, comm: 4, mgmt: 4, lang: 3, influence: 3 }
                if (/咨询|顾问|交付/i.test(role)) return { tech: 3, eng: 2, domain: 4, data: 4, comm: 5, mgmt: 4, lang: 3, influence: 3 }
                return { tech: 3, eng: 3, domain: 3, data: 3, comm: 3, mgmt: 2, lang: 2, influence: 2 }
              })()

              const dims = [
                {
                  key: 'tech',
                  label: '专业技能',
                  required: requiredPreset.tech,
                  current: skillMax,
                  evidence: [`技能条目：${skillsItems.length}`, skillsItems.length ? `最高熟练度：${skillMax}/5` : '未填写技能清单']
                },
                {
                  key: 'eng',
                  label: '工程化/交付',
                  required: requiredPreset.eng,
                  current: engScore,
                  evidence: [`项目数：${projectsItems.length}`, projectCaps.length ? `能力栈：${projectCaps.slice(0, 6).join(' / ')}` : null].filter(Boolean)
                },
                {
                  key: 'domain',
                  label: '行业/业务理解',
                  required: requiredPreset.domain,
                  current: domainScore,
                  evidence: [projectsItems.some((p) => String(p?.industry ?? '').trim()) ? '项目已填写行业信息' : '项目未体现行业/业务背景']
                },
                {
                  key: 'data',
                  label: '数据与指标',
                  required: requiredPreset.data,
                  current: dataScore,
                  evidence: [achievementHasNumber ? '成就含量化指标' : '成就缺少量化指标（建议补齐口径与基线）']
                },
                {
                  key: 'comm',
                  label: '沟通协作',
                  required: requiredPreset.comm,
                  current: commScore,
                  evidence: [tagText ? `标签：${tagText.split(' / ').slice(0, 6).join(' / ')}` : '未设置软技能标签/文本证据']
                },
                {
                  key: 'mgmt',
                  label: '管理与带团队',
                  required: requiredPreset.mgmt,
                  current: mgmtScore,
                  evidence: [
                    expItems.length ? `就职条目：${expItems.length}` : '未填写就职履历',
                    maxManaged > 0 ? `最高管理人数：${maxManaged}` : hasLeadTitle ? '履历含负责人/管理角色关键词' : '管理经验未体现'
                  ]
                },
                {
                  key: 'lang',
                  label: '语言能力',
                  required: requiredPreset.lang,
                  current: langMax,
                  evidence: [langSummary || '未填写语言能力']
                },
                {
                  key: 'influence',
                  label: '影响力/作品',
                  required: requiredPreset.influence,
                  current: influenceScore,
                  evidence: [
                    artifactsItems.length ? `作品数：${artifactsItems.length}` : '未填写作品/证明材料',
                    maxStars ? `开源最高 Stars：${maxStars}` : null
                  ].filter(Boolean)
                }
              ].map((d) => {
                const gap = Math.max(0, Number(d.required) - Number(d.current))
                const priority = gap * (d.key === 'tech' ? 3 : d.key === 'comm' ? 2 : 1)
                const recommendations = gap
                  ? [
                      `${d.label}：用“项目化练习 + 证据产出”补齐到 ${d.required}/5`,
                      '写入作品集证据：链接/指标/复盘/文档/演讲稿'
                    ]
                  : ['已满足或接近目标要求，建议继续用项目证据巩固']
                return { ...d, gap, priority, recommendations }
              })

              const ordered = [...dims].sort((a, b) => b.priority - a.priority)
              const indicators = dims.map((d) => ({ name: d.label, max: 5 }))
              const required = dims.map((d) => d.required)
              const current = dims.map((d) => d.current)
              return {
                targetRole: role,
                indicators,
                required,
                current,
                items: ordered
              }
            })()

            const outputPublishingAdvice = {
              whatToPublish: [
                '项目复盘：背景/目标/方案/权衡/结果/指标口径',
                '方法沉淀：模板/清单/规范/流程（可复用）',
                '作品集：开源项目 README + Demo + 测试/CI + 发布记录',
                '演讲/课程/视频课：从 1 篇文章扩展成分享稿与课程大纲'
              ],
              whereToPublish: ['GitHub', '个人博客/公众号', '知乎/掘金/CSDN', 'B 站/视频号/抖音（适合短内容复用）'],
              cadence: ['每周 1 次输出（文章/笔记/短视频择一）', '每月 1 次长内容（复盘/分享/课程）', '每季度 1 个“可复用资产”（仓库/课程/模板）'],
              repurposePlan: ['一稿多投：文章→PPT→演讲→课程→视频课→开源 Demo', '同主题连载：3-5 篇形成系列，再汇总成作品集专题页']
            }

            const influenceAdvice = {
              channels: [
                socialCount ? '优先深耕已存在的渠道（保持连续性）' : '先建立 1-2 个主阵地：GitHub + 博客/公众号',
                '用“作品集主页”承接流量：项目/文章/演讲/证书/联系方式统一入口'
              ],
              weeklyActions: [
                '每周固定 2 小时：维护作品集（README/案例/截图/指标）',
                '每周固定 1 次：输出（文章/短视频/分享稿）',
                '每周固定 1 次：社交互动（Issue/PR/评论/同领域互访）'
              ],
              portfolioPackaging: [
                '为每个项目准备：一句话定位 + 关键技术/方法 + 结果指标 + 链接',
                '把“影响力指标”显性化：Stars/Forks/阅读量/观看量/引用/落地案例（若有）'
              ]
            }

            const interviewAdvice = (() => {
              const role = String(targetRole ?? '').trim()
              const mustPrepareTopics = ['自我介绍（90 秒版本）', '职业主线与动机', '两个主项目案例深挖', '一条失败/复盘案例', '团队协作与冲突处理']
              const behavioral = [
                '用 STAR 准备 8-12 个故事：挑战、影响、学习、冲突、推动、失败复盘',
                '每个故事准备“数据口径与证据”：指标、对比基线、影响范围、截图/文档/PR'
              ]
              const technical = []
              if (/测试|QA|质量/i.test(role)) {
                technical.push('测试策略与分层、自动化与稳定性、质量度量与治理、线上故障复盘')
                technical.push('CI/CD 质量门禁、Mock/测试数据、覆盖率与回归效率')
              } else if (/产品|PM/i.test(role)) {
                technical.push('需求分析、指标体系、实验设计、优先级与资源权衡、版本规划与复盘')
              } else if (/咨询|顾问|交付/i.test(role)) {
                technical.push('问题定义与结构化分析、方案设计与落地、干系人管理、价值量化与复盘')
              } else {
                technical.push('系统设计/架构权衡、数据与指标、性能与稳定性、协作与交付')
              }
              const mockPlan = [
                '第 1 周：梳理项目与故事库，完成 2 套主案例讲稿',
                '第 2 周：做 2 次模拟面试（技术/行为各 1 次），复盘并补证据',
                '第 3-4 周：针对薄弱点定向训练（题库+项目复现+输出）'
              ]
              return { mustPrepareTopics, behavioral, technical, mockPlan }
            })()

            const marketStrategy = {
              searchStrategy: ['明确 3-5 个岗位关键词 + 2-3 个同义词组合搜索', '按城市/年限/薪资先收敛再精确', '优先投递与项目经历高度匹配的岗位'],
              referralStrategy: ['准备 1 页“自我介绍 + 主项目亮点 + 想要的岗位”便于内推', '维护 20 人“弱关系名单”：同事/校友/社区，每周触达 2-3 人'],
              portfolioStrategy: ['作品集优先展示“可验证证据”的项目：链接/数据/复盘/截图', '每个作品都要能回答：你做了什么、难点、权衡、结果'],
              applicationRhythm: ['每周固定节奏：筛选→投递→复盘→迭代简历', '每周至少完成 2 次面试训练（含模拟）'],
              industryFocus: (() => {
                const expItems = Array.isArray(experience?.items) ? experience.items : []
                const projItems = Array.isArray(projects?.items) ? projects.items : []

                const expIndustries = expItems.map((x) => String(x?.industry ?? '').trim()).filter(Boolean)
                const projIndustries = projItems.map((x) => String(x?.industry ?? '').trim()).filter(Boolean)
                const industries = [...expIndustries, ...projIndustries].filter(Boolean)
                const uniq = Array.from(new Set(industries))

                const depthEvidence = (() => {
                  const achievementHasNumber = Array.isArray(achievements?.items)
                    ? achievements.items.some((a) => /\d|%|万|k|w/i.test(String(a?.result ?? '').trim()))
                    : false
                  const domainNamed = projItems.some((p) => String(p?.industry ?? '').trim())
                  const toolsCount = Array.isArray(tools?.items) ? tools.items.length : 0
                  const evid = []
                  if (achievementHasNumber) evid.push('有量化成果（成就）')
                  if (domainNamed) evid.push('项目体现行业/业务背景')
                  if (toolsCount > 0) evid.push('有结构化工具/方法沉淀')
                  return evid
                })()

                const status = uniq.length >= 4 ? '跨行业' : uniq.length >= 2 ? '多行业' : uniq.length === 1 ? '深耕' : '未知'

                const notes = []
                if (status === '跨行业' || status === '多行业') {
                  notes.push('切换行业不必然是负面：如果每个行业都能沉淀可迁移的方法/成果证据（指标、复盘、作品），可视为“跨域能力”。')
                  notes.push(
                    depthEvidence.length
                      ? `深度证据：${depthEvidence.join(' / ')}（建议按行业分别补齐“问题→方案→结果→口径”）`
                      : '深度证据不足：建议在最近 1-2 个行业内补齐可量化成果与作品，避免“浅尝辄止”的印象。'
                  )
                } else if (status === '深耕') {
                  notes.push('行业内深耕有利于形成“领域专家”叙事：建议补齐领域知识、方法论与代表项目的可验证证据。')
                } else {
                  notes.push('行业信息不足：建议在项目/就职履历补齐行业字段，以便判断是否深耕或跨行业发展。')
                }

                return { status, industries: uniq.slice(0, 8), notes }
              })()
            }

            const riskAndConstraints = (() => {
              const constraintsList = []
              if (hoursPerWeek != null) constraintsList.push(`每周可投入时间：${hoursPerWeek} 小时`)
              const geoMode = String(constraints?.geoAndMode ?? '').trim()
              if (geoMode) constraintsList.push(`地域/方式约束：${geoMode}`)
              const risks = []
              const mitigations = []
              if (isJapanTarget && !hasJapanese) {
                risks.push('目标地区包含日本，但语言清单未体现日语能力')
                mitigations.push('补齐日语能力与证据：JLPT 目标、学习计划、可沟通场景示例')
              }
              if (ladderJumper?.score >= 4) {
                risks.push('履历稳定性可能被追问（频繁变动/任职较短）')
                mitigations.push('准备统一叙事：每次变动原因与收益、关键成果、风险控制')
              }
              return { constraints: constraintsList, risks, mitigations }
            })()

            const analysis = {
              stage: 'done',
              generatedAt: now,
              generatedAtUtc: nowUtc,
              blocked: completenessBlocked ? { reason: '信息不完整，需补齐后才能分析差距/可行性' } : null,
              goalPanel: completenessBlocked ? null : { smart: { score: smartScore, checks: smartChecks }, feasibility, value: goalValue },
              personalPanel: {
                completeness: {
                  missing: missingProfileFields,
                  hints: [
                    Array.isArray(education?.items) && education.items.length > 0 ? null : '建议补齐教育信息',
                    Array.isArray(experience?.items) && experience.items.length > 0 ? null : '建议补齐就职履历',
                    hasStrengths ? null : '建议补齐长处',
                    hasWeaknesses ? null : '建议补齐短处',
                    maritalStatus === 'unknown' ? '建议补齐婚否（用于评估迁移与稳定性）' : null,
                    socialSecurityYears == null ? '建议补齐社保缴纳年限（用于评估保障与成本）' : null
                  ].filter(Boolean)
                },
                consistency: { issues: consistencyIssues },
                ladderJumper,
                summary: (() => {
                  const expItems = Array.isArray(experience?.items) ? experience.items : []
                  const projItems = Array.isArray(projects?.items) ? projects.items : []
                  const pers = Array.isArray(personality?.items) ? personality.items : []
                  const toolsItems = Array.isArray(tools?.items) ? tools.items : []

                  const titles = expItems.map((x) => String(x?.title ?? '').trim()).filter(Boolean)
                  const maxManaged = expItems.reduce((acc, x) => Math.max(acc, Number.isFinite(Number(x?.managedCount)) ? Number(x.managedCount) : 0), 0)
                  const growth = [
                    titles.length ? `岗位轨迹：${titles.slice(0, 4).join(' → ')}` : '未填写就职履历，成长轨迹不清晰',
                    maxManaged > 0 ? `管理经验：最高管理人数约 ${maxManaged} 人` : '管理经验未体现（如目标含管理路径，建议补齐带团队/影响范围）'
                  ]

                  const projIndustries = projItems.map((p) => String(p?.industry ?? '').trim()).filter(Boolean)
                  const projTypes = projItems.map((p) => String(p?.type ?? '').trim()).filter(Boolean)
                  const projectExperience = [
                    projItems.length ? `项目数量：${projItems.length}` : '未填写项目经历（建议至少 2-3 个可对外讲清楚的案例）',
                    projIndustries.length ? `行业覆盖：${Array.from(new Set(projIndustries)).slice(0, 4).join(' / ')}` : '项目未体现行业/业务背景',
                    projTypes.length ? `项目类型：${Array.from(new Set(projTypes)).slice(0, 4).join(' / ')}` : null
                  ].filter(Boolean)

                  const personalityText = pers.map((x) => String(x?.text ?? x ?? '').trim()).filter(Boolean)
                  const personalitySummary = personalityText.length ? `性格特征：${personalityText.slice(0, 8).join(' / ')}` : '未填写性格特征（用于综合判断岗位匹配与沟通风格）'

                  const toolkitText = toolsItems.map((x) => String(x?.name ?? '').trim()).filter(Boolean)
                  const toolkitSummary = toolkitText.length ? `工具/方法：${toolkitText.slice(0, 10).join(' / ')}` : '工具/方法未填写（建议补齐常用图表与结构化方法论）'

                  const conclusion = [
                    expItems.length && projItems.length ? '信息较完整，可进一步把“能力”转成“可验证证据”（链接/指标/复盘）' : '信息不完整，优先补齐履历与项目，再进行差距与财务分析',
                    toolkitText.length ? '已具备结构化工具基础，可用在需求澄清/复盘/沟通推进中形成证据' : '建议把工具/方法用于真实项目产出（图、纪要、决策记录），并沉淀为作品'
                  ].filter(Boolean).join('；')

                  return { growth, projectExperience, personalitySummary, toolkitSummary, conclusion }
                })()
              },
              gapAnalysis: completenessBlocked ? null : { targetRole, industries, domains: gapPanels },
              artifactsPanel: {
                insights: artifactInsights,
                recommendedAdditions: (() => {
                  const role = String(targetRole ?? '').trim()
                  const out = [
                    '补齐 1 篇“主项目复盘”：背景→目标→方案→权衡→结果→指标口径（可公开版本）',
                    '补齐 1 个“可验证证据”的作品：链接/演示/README/截图/指标/复盘',
                    '补齐 1 次对外表达：演讲稿/PPT/视频/文章（展示结构化表达与影响力）'
                  ]
                  if (/测试|QA|质量/i.test(role)) out.unshift('补齐“质量工程/自动化/门禁”作品：覆盖率、回归效率、缺陷率、稳定性治理等可量化指标')
                  else if (/产品|PM/i.test(role)) out.unshift('补齐“需求到结果”作品：PRD/用户研究/指标体系/实验复盘/里程碑推进证据')
                  else if (/咨询|顾问|交付/i.test(role)) out.unshift('补齐“咨询交付”作品：问题定义→方案→落地→收益量化与复盘')
                  else out.unshift('补齐“工程化/平台化”作品：可复用组件/脚手架/自动化/可观测，配套文档与演示')
                  return out
                })()
              },
              resumePreparationAdvice,
              workDevelopmentAdvice,
              certificationAdvice,
              softSkillsPanel,
              professionalSkillsAdvice,
              languageAbilityAdvice,
              capabilityMap,
              salaryGapPanel,
              financialPanel,
              outputPublishingAdvice,
              influenceAdvice,
              interviewAdvice,
              marketStrategy,
              riskAndConstraints,
              inputsSnapshot: {
                hasJobIntent: Array.isArray(jobIntent?.items) && jobIntent.items.length > 0,
                personalityCount: Array.isArray(personality?.items) ? personality.items.length : 0,
                salaryExpectation,
                hoursPerWeek,
                languageCount: Array.isArray(languages?.items) ? languages.items.length : 0
              }
            }

            await fs.mkdir(outputsDir, { recursive: true })
            stage = 'write_outputs'
            await fs.writeFile(path.join(outputsDir, 'analysis.json'), JSON.stringify(analysis, null, 2), 'utf-8')
            await fs.writeFile(path.join(outputsDir, 'gap_analysis.json'), JSON.stringify(analysis.gapAnalysis ?? { generatedAt: now, blocked: true }, null, 2), 'utf-8')

            await fs.mkdir(artifactsDir, { recursive: true })
            stage = 'write_artifacts'
            await fs.writeFile(path.join(artifactsDir, 'analysis_latest.json'), JSON.stringify(analysis, null, 2), 'utf-8')
            const historyPath = path.join(artifactsDir, 'analysis_history.json')
            const history = (await readJsonFile(historyPath, { items: [] })) ?? { items: [] }
            const prevItems = Array.isArray(history?.items) ? history.items : []
            const id = String(nowUtc).replace(/[^\dTZ]/g, '').slice(0, 15) || String(Date.now())
            const entry = {
              id,
              generatedAt: now,
              generatedAtUtc: nowUtc,
              targetRole,
              industries,
              analysis
            }
            const items = [entry, ...prevItems].slice(0, 30)
            await fs.writeFile(historyPath, JSON.stringify({ items }, null, 2), 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(analysis))
          } catch (e) {
            const rawMsg = String(e?.message ?? e ?? '').trim()
            const details = []
            const stageMap = {
              init: '初始化',
              read_inputs: '读取输入文件',
              salary_gap: '计算薪资差距',
              artifact_insights: '生成作品分析',
              language_advice: '生成语言建议',
              capability_map: '生成能力映射',
              write_outputs: '写入 outputs',
              write_artifacts: '写入 artifacts'
            }
            const stageLabel = stageMap[String(stage)] ?? String(stage)
            if (stageLabel) details.push(`失败阶段：${stageLabel}`)
            if (rawMsg) details.push(`错误信息：${rawMsg}`)
            if (/failed to fetch|ECONNREFUSED|ENOTFOUND|network/i.test(rawMsg)) {
              details.push('可能原因：网络不可用，或本地开发服务未正常启动')
            }
            if (/EACCES|EPERM/i.test(rawMsg)) {
              details.push('可能原因：目录/文件无写入权限（work/outputs 或 work/artifacts）')
            }
            if (/JSON/i.test(rawMsg) && /parse/i.test(rawMsg)) {
              details.push('可能原因：某个输入 JSON 文件内容格式不正确（work/inputs/*.json）')
            }
            if (/Cannot read properties of undefined|is not a function|ReferenceError/i.test(rawMsg)) {
              details.push('可能原因：输入数据结构与预期不一致，或本地分析逻辑存在运行时错误')
            }
            details.push('建议：先点“去补齐信息”补齐缺失字段；若仍失败，打开 DevTools/终端查看具体报错信息并按提示修订输入')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(
              JSON.stringify({
                generatedAt: requestAtLocal,
                generatedAtUtc: requestAtUtc,
                blocked: {
                  reason: rawMsg ? `分析失败：${rawMsg}` : '分析失败：发生未知错误',
                  details,
                  stage: String(stage),
                  error: rawMsg
                }
              })
            )
          }
        })

        server.middlewares.use('/api/plan', async (req, res) => {
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

            const analysis = (await readJsonFile(path.join(outputsDir, 'analysis.json'), null)) ?? null
            if (!analysis) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'Missing analysis', message: '请先点击“分析”生成 analysis.json' }))
              return
            }

            const constraints = (await readJsonFile(path.join(inputsDir, 'constraints.json'), {})) ?? {}
            const hoursPerWeek = typeof constraints?.hoursPerWeek === 'number' && Number.isFinite(constraints.hoursPerWeek) ? constraints.hoursPerWeek : null

            const formatDateYMD = (d) => {
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${y}-${m}-${day}`
            }
            const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000)

            const now = new Date()
            const start0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            const capItems = Array.isArray(analysis?.capabilityMap?.items) ? analysis.capabilityMap.items : []
            const topGaps = capItems
              .filter((x) => Number(x?.gap ?? 0) > 0)
              .sort((a, b) => Number(b?.gap ?? 0) - Number(a?.gap ?? 0))
              .slice(0, 4)
            const gapLabels = topGaps.map((x) => String(x?.label ?? '').trim()).filter(Boolean)

            const focusAreas = Array.isArray(analysis?.professionalSkillsAdvice?.focusAreas) ? analysis.professionalSkillsAdvice.focusAreas : []
            const focusText = focusAreas.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 3)

            const langWeekly = Array.isArray(analysis?.languageAbilityAdvice?.weeklyPlan) ? analysis.languageAbilityAdvice.weeklyPlan : []
            const langTasks = langWeekly.map((x) => String(x ?? '').trim()).filter(Boolean)

            const toCommaList = (arr, limit) => arr.filter(Boolean).slice(0, limit).join(' / ')
            const gapShort = toCommaList(gapLabels, 2)
            const focusShort = toCommaList(focusText, 2)

            const weekStart = (i) => addDays(start0, (i - 1) * 7)
            const weekEnd = (i) => addDays(start0, (i - 1) * 7 + 6)

            const ms = []
            ms.push({
              id: 'w1',
              name: `第 1 周：目标岗位能力拆解${gapShort ? `（${gapShort}）` : ''}`,
              start: formatDateYMD(weekStart(1)),
              end: formatDateYMD(weekEnd(1)),
              objective: '把目标岗位拆成可执行能力项，并补齐基础材料与证据目录',
              deliverables: ['目标岗位 JD 能力拆解表（含证据链接列）', '个人能力盘点（现状/差距/举证）', '简历信息补齐清单（缺什么补什么）'],
              acceptanceCriteria: ['能力拆解表 >= 20 行', '每个能力至少 1 个证据入口（项目/作品/经历/草稿）']
            })
            ms.push({
              id: 'w2',
              name: `第 2 周：补齐关键短板${gapShort ? `（${gapShort}）` : ''}`,
              start: formatDateYMD(weekStart(2)),
              end: formatDateYMD(weekEnd(2)),
              objective: '针对差距最大的 1-2 项能力，做项目化练习并形成可展示产出',
              deliverables: ['一个可展示的最小作品（Demo/截图/链接）', '一份技术/方案复盘（1-2 页）', '更新简历中的项目亮点（量化）'],
              acceptanceCriteria: ['至少 1 个可点击链接/可演示材料', '复盘包含问题-方案-结果-反思']
            })
            ms.push({
              id: 'w3',
              name: `第 3 周：核心项目 1（对标岗位）${focusShort ? `（${focusShort}）` : ''}`,
              start: formatDateYMD(weekStart(3)),
              end: formatDateYMD(weekEnd(3)),
              objective: '完成 1 个对标目标岗位的主项目/案例，能讲清楚架构、权衡与结果',
              deliverables: ['项目 README（背景/架构/关键设计）', '关键模块代码或设计图', '可量化指标或对比结果（如性能/成本/效率）'],
              acceptanceCriteria: ['面试 5 分钟能讲清楚：问题→方案→权衡→结果→复盘']
            })
            ms.push({
              id: 'w4',
              name: '第 4 周：简历与作品集打磨（可投递版本）',
              start: formatDateYMD(weekStart(4)),
              end: formatDateYMD(weekEnd(4)),
              objective: '形成可投递的简历与作品集结构，并完成 2 个版本的优化迭代',
              deliverables: ['一页简历（中文/英文按需）', '作品集目录页（链接聚合）', 'STAR/量化表达改写清单'],
              acceptanceCriteria: ['简历中 3-5 条成果可量化', '作品集链接齐全可打开']
            })
            ms.push({
              id: 'w5',
              name: '第 5 周：面试题库与项目讲述（强化）',
              start: formatDateYMD(weekStart(5)),
              end: formatDateYMD(weekEnd(5)),
              objective: '建立面试题库并完成系统训练，补齐薄弱题型',
              deliverables: ['面试题库（分类：基础/系统/业务/行为）', '2 次模拟面试录音或纪要', '项目讲述脚本（3/5/10 分钟版本）'],
              acceptanceCriteria: ['模拟面试得分有对比（至少 2 次）', '能清晰回答 30+ 高频题']
            })
            ms.push({
              id: 'w6',
              name: `第 6 周：语言能力（输出与证据）`,
              start: formatDateYMD(weekStart(6)),
              end: formatDateYMD(weekEnd(6)),
              objective: '把语言能力转成可验证证据（证书/输出/面试表达）',
              deliverables: [
                '语言能力证明（证书/成绩/测评链接）',
                '1 篇双语/外语技术输出（文章/演讲稿/README）',
                ...(langTasks.length ? [`本周训练：${langTasks.slice(0, 3).join('；')}`] : [])
              ],
              acceptanceCriteria: ['至少 1 个可验证证明', '输出内容可公开访问或可展示']
            })
            ms.push({
              id: 'w7',
              name: '第 7 周：投递与迭代（数据驱动）',
              start: formatDateYMD(weekStart(7)),
              end: formatDateYMD(weekEnd(7)),
              objective: '建立投递漏斗（投递-回复-面试-Offer），用数据迭代简历与话术',
              deliverables: ['投递表（渠道/岗位/状态/反馈）', '简历 A/B 测试记录', '常见拒信原因与修正动作'],
              acceptanceCriteria: ['有明确每周投递目标与复盘动作', '至少 1 轮优化闭环']
            })
            ms.push({
              id: 'w8',
              name: '第 8 周：收敛与决策（Offer/留任两手准备）',
              start: formatDateYMD(weekStart(8)),
              end: formatDateYMD(weekEnd(8)),
              objective: '形成最终选择方案：拿 Offer 或内部发展路线（不跳槽版本）',
              deliverables: ['Offer/留任决策矩阵', '谈薪/谈职责话术', '未来 3 个月行动计划（滚动）'],
              acceptanceCriteria: ['能给出 2 套可执行方案，并明确风险与缓解']
            })

            const todos = []
            const addTodo = (milestoneId, title, due, priority, evidence) => {
              todos.push({
                id: `${milestoneId}-${String(todos.length + 1).padStart(2, '0')}`,
                milestoneId,
                title,
                due,
                status: 'todo',
                priority,
                evidence
              })
            }
            addTodo('w1', '完成目标岗位 JD 拆解表（含证据列）', formatDateYMD(addDays(weekStart(1), 2)), 'P0', '表格链接/截图')
            addTodo('w1', '补齐简历基础信息与缺失条目', formatDateYMD(addDays(weekStart(1), 5)), 'P0', '分析页缺失项清零')
            addTodo('w2', '完成最小作品 Demo（可展示）', formatDateYMD(addDays(weekStart(2), 4)), 'P0', '链接/截图/演示视频')
            addTodo('w2', '产出一次复盘（问题-方案-结果-反思）', formatDateYMD(addDays(weekStart(2), 6)), 'P1', '文章/文档链接')
            addTodo('w3', '核心项目 1：补齐 README/架构图/关键权衡', formatDateYMD(addDays(weekStart(3), 6)), 'P0', 'README/架构图')
            addTodo('w4', '简历改写：至少 3 条成果量化', formatDateYMD(addDays(weekStart(4), 3)), 'P0', '简历版本对比')
            addTodo('w4', '作品集目录页（统一链接）', formatDateYMD(addDays(weekStart(4), 6)), 'P1', '聚合页链接')
            addTodo('w5', '整理面试题库（>=30 高频题）', formatDateYMD(addDays(weekStart(5), 4)), 'P0', '题库文档')
            addTodo('w5', '完成 1 次模拟面试并复盘', formatDateYMD(addDays(weekStart(5), 6)), 'P1', '录音/纪要')
            addTodo('w6', '语言证明材料整理（证书/成绩/测评）', formatDateYMD(addDays(weekStart(6), 2)), 'P1', '证明截图/链接')
            addTodo('w6', '语言输出 1 篇（双语/外语）', formatDateYMD(addDays(weekStart(6), 6)), 'P2', '文章/README')
            addTodo('w7', '建立投递漏斗表并设定每周目标', formatDateYMD(addDays(weekStart(7), 1)), 'P0', '表格链接')
            addTodo('w8', '完成决策矩阵（Offer vs 留任）', formatDateYMD(addDays(weekStart(8), 4)), 'P0', '决策文档')

            const weeklyRoutine = {
              focus: hoursPerWeek == null ? '建议先填写每周可投入时间（hoursPerWeek）后再细化节奏' : `每周可投入约 ${hoursPerWeek} 小时`,
              breakdown: [
                '项目/作品：70%',
                '学习：20%',
                '输出/复盘：10%'
              ]
            }

            const projects = (() => {
              const rec = Array.isArray(analysis?.workDevelopmentAdvice?.recommendedProjectTypes) ? analysis.workDevelopmentAdvice.recommendedProjectTypes : []
              const base = rec.length ? rec : ['平台化/工程化作品（可复用能力）', '对标目标岗位的主项目案例（可量化成果）']
              return base.slice(0, 4).map((title, idx) => ({
                id: `p${idx + 1}`,
                title: String(title ?? '').trim(),
                goal: '形成可验证证据（链接/指标/复盘/演示）',
                deliverables: ['README/方案文档', '可演示 Demo 或截图', '复盘文章/分享稿', '指标或对比结果（如有）']
              }))
            })()

            const plan = {
              generatedAt: formatDateYMD(start0),
              basedOn: { analysisGeneratedAt: String(analysis?.generatedAt ?? '') },
              milestones: ms,
              todos,
              weeklyRoutine,
              projects
            }

            await fs.mkdir(outputsDir, { recursive: true })
            await fs.writeFile(path.join(outputsDir, 'plan.json'), JSON.stringify(plan, null, 2), 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(plan))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Plan failed', message: String(e?.message ?? e) }))
          }
        })
      }
    }
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
})
