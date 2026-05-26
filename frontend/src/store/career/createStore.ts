import { computed, h, ref, watch } from 'vue'
import { getJson, putJson } from './api'
import { formatDateYMD, makeId, normalizeTags, scheduleSave, withIds } from './helpers'
import {
  academicDegreeOptions,
  artifactTypeOptions,
  capabilityStackOptions,
  certificateTreeData,
  companyTypeOptions,
  degreeOptions,
  educationTypeOptions,
  genderOptions,
  hashtagCategories,
  industryOptions,
  languageLevelOptions,
  languageNameOptions,
  lifeStatusOptions,
  maritalStatusOptions,
  personalityOptions,
  projectTypeOptions,
  skillLevelOptions,
  skillTreeData,
  socialPlatformOptions,
  speechLocationOptions,
  strengthsQuickOptions,
  techStackTreeData,
  weaknessesQuickOptions,
  workModeOptions,
  yesNoUnknownOptions
} from './options'
import type { Constraints, Goals, Profile } from './types'

export function useCareerStore() {
  return store
}

const store = createCareerStore()

function createCareerStore() {
  const activeKey = ref('profile')

  const defaultOpenKeys = [
    'resume',
    'profileGroup',
    'traitsGroup',
    'resumeGroup',
    'proofGroup',
    'influenceGroup',
    'constraintsGroup',
    'goalGroup'
  ]

  function setActiveKey(key: string) {
    activeKey.value = key || 'profile'
  }

  const breadcrumbs = computed(() => {
    const map: Record<string, string[]> = {
      profile: ['个人简历', '个人信息', '个人信息'],
      hashtags: ['个人简历', '个人信息', '标签'],
      skills: ['个人简历', '个人信息', '技能'],
      languages: ['个人简历', '个人信息', '语言'],
      strengths: ['个人简历', '个人信息', '长处/短处'],
      education: ['个人简历', '履历', '教育履历'],
      experience: ['个人简历', '履历', '就职履历'],
      projects: ['个人简历', '履历', '项目履历'],
      artifacts: ['个人简历', '证明材料', '作品'],
      awards: ['个人简历', '证明材料', '奖励'],
      honors: ['个人简历', '证明材料', '荣誉'],
      achievements: ['个人简历', '证明材料', '成就'],
      certificates: ['个人简历', '证明材料', '证书'],
      speech: ['个人简历', '影响力', '演讲'],
      community: ['个人简历', '影响力', '社区'],
      social: ['个人简历', '影响力', '社交媒体'],
      constraints: ['约束', '基本约束'],
      jobIntent: ['约束', '求职意向'],
      personality: ['个人简历', '特征', '性格特征'],
      goals: ['目标', '目标设定'],
      goalCandidates: ['目标', '候选'],
      analysis: ['分析'],
      plan: ['发展计划']
    }
    return map[activeKey.value] ?? [activeKey.value]
  })

  const workModeLabelMap = computed(() => {
    const map: Record<string, string> = {}
    ;(Array.isArray(workModeOptions) ? workModeOptions : []).forEach((o: any) => {
      const v = String(o?.value ?? '')
      const l = String(o?.label ?? '')
      if (v) map[v] = l || v
    })
    return map
  })

  const skillLevelLabelMap = computed(() => {
    const map: Record<string, string> = {}
    ;(Array.isArray(skillLevelOptions) ? skillLevelOptions : []).forEach((o: any) => {
      const v = String(o?.value ?? '')
      const l = String(o?.label ?? '')
      if (v) map[v] = l || v
    })
    return map
  })

  const languageLevelLabelMap = computed(() => {
    const map: Record<string, string> = {}
    ;(Array.isArray(languageLevelOptions) ? languageLevelOptions : []).forEach((o: any) => {
      const v = String(o?.value ?? '')
      const l = String(o?.label ?? '')
      if (v) map[v] = l || v
    })
    return map
  })

  const profile = ref<Profile>({
    basics: {
      name: '',
      birthMonth: '',
      gender: 'unknown',
      maritalStatus: 'unknown',
      currentTitle: '',
      location: '',
      yearsOfExperience: null
    },
    summary: '',
    family: {
      childrenBirthMonths: [],
      parents: {
        fatherBirthMonth: '',
        motherBirthMonth: '',
        fatherHasPension: null,
        motherHasPension: null,
        fatherLifeStatus: 'unknown',
        motherLifeStatus: 'unknown'
      },
      socialSecurityYears: null
    },
    preferences: {
      industries: [],
      roleDirections: [],
      workMode: 'any',
      geoPreference: '',
      salaryExpectation: ''
    }
  })

  const educationItems = ref([] as any[])
  const experienceItems = ref([] as any[])
  const artifactsItems = ref([] as any[])
  const projectsItems = ref([] as any[])
  const awardsItems = ref([] as any[])
  const honorsItems = ref([] as any[])
  const achievementsItems = ref([] as any[])
  const certificatesItems = ref([] as any[])
  const speechItems = ref([] as any[])
  const communityItems = ref([] as any[])
  const socialItems = ref([] as any[])
  const strengthsItems = ref([] as any[])
  const weaknessesItems = ref([] as any[])
  const skillsItems = ref([] as any[])
  const languagesItems = ref([] as any[])
  const jobIntentItems = ref([] as any[])
  const personalityItems = ref([] as any[])
  const goalItems = ref([] as any[])

  const strengthsQuickSelected = ref([] as any[])
  const weaknessesQuickSelected = ref([] as any[])
  const personalityQuickSelected = ref([] as any[])
  const skillsQuickSelected = ref([] as any[])
  const skillsQuickLevel = ref('intermediate')

  const hashtagData = ref({
    selected: [] as string[]
  })

  const hashtagFlatOptions = computed(() => {
    const selected = new Set(Array.isArray(hashtagData.value.selected) ? hashtagData.value.selected : [])
    const values = (hashtagCategories ?? [])
      .flatMap((c: any) => (Array.isArray(c?.tags) ? c.tags : []))
      .filter((x: any) => typeof x === 'string' && x.trim())
    const merged = Array.from(new Set([...values, ...Array.from(selected)]))
    return merged.map((v) => ({ value: v }))
  })

  function addHashtag(tag: string) {
    const t = String(tag ?? '').trim()
    if (!t) return
    const selected = Array.isArray(hashtagData.value.selected) ? hashtagData.value.selected : []
    if (selected.includes(t)) return
    hashtagData.value.selected = [t, ...selected]
  }

  const goals = ref<Goals>({
    timeWindow: '',
    successCriteria: ''
  })

  const constraints = ref<Constraints>({
    hoursPerWeek: null,
    geoAndMode: '',
    notes: ''
  })

  const planText = ref('')
  const planPlaceholder = '{\n  "milestones": [],\n  "weeklyRoutine": {},\n  "projects": []\n}'

  const planParseError = computed(() => {
    const raw = String(planText.value ?? '').trim()
    if (!raw) return 'plan.json 为空'
    try {
      JSON.parse(raw)
      return ''
    } catch (e: any) {
      return `plan.json 不是合法 JSON：${String(e?.message ?? e)}`
    }
  })

  const ganttColumns = [
    { title: '里程碑', dataIndex: 'name', key: 'name' },
    { title: '开始', dataIndex: 'start', key: 'start' },
    { title: '结束', dataIndex: 'end', key: 'end' },
    { title: '甘特', key: 'bar' }
  ]

  const ganttRows = computed(() => {
    const raw = String(planText.value ?? '').trim()
    if (!raw) return []
    let obj: any = null
    try {
      obj = JSON.parse(raw)
    } catch {
      return []
    }

    const ms = Array.isArray(obj?.milestones) ? obj.milestones : []
    const tasks = ms
      .map((m: any) => ({
        id: m?.id ?? makeId(),
        name: String(m?.name ?? m?.title ?? '').trim(),
        start: String(m?.start ?? '').trim(),
        end: String(m?.end ?? '').trim()
      }))
      .filter((t: any) => t.name && t.start && t.end)

    const toTime = (s: string) => {
      const d = new Date(s)
      const t = d.getTime()
      return Number.isFinite(t) ? t : NaN
    }

    const times = tasks.flatMap((t: any) => [toTime(t.start), toTime(t.end)]).filter((t: any) => Number.isFinite(t))
    if (times.length === 0) return tasks.map((t: any) => ({ ...t, leftPct: 0, widthPct: 0 }))
    const minT = Math.min(...times)
    const maxT = Math.max(...times)
    const span = Math.max(1, maxT - minT)

    return tasks.map((t: any) => {
      const sT = toTime(t.start)
      const eT = toTime(t.end)
      if (!Number.isFinite(sT) || !Number.isFinite(eT)) return { ...t, leftPct: 0, widthPct: 0 }
      const leftPct = Math.max(0, Math.min(100, ((sT - minT) / span) * 100))
      const widthPct = Math.max(0, Math.min(100 - leftPct, ((eT - sT) / span) * 100))
      return { ...t, leftPct: Number(leftPct.toFixed(2)), widthPct: Number(widthPct.toFixed(2)) }
    })
  })

  const rowKey = (record: any) => record.id

  const educationColumns = [
    { title: '学校', dataIndex: 'school', key: 'school' },
    { title: '学历', dataIndex: 'degree', key: 'degree' },
    { title: '学位', dataIndex: 'academicDegree', key: 'academicDegree' },
    { title: '学习形式', dataIndex: 'eduType', key: 'eduType' },
    { title: '院系/分学院', dataIndex: 'campus', key: 'campus' },
    { title: '专业', dataIndex: 'field', key: 'field' },
    { title: '时间', dataIndex: 'range', key: 'range' },
    { title: '操作', key: 'actions' }
  ]

  const experienceColumns = [
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '公司类型', dataIndex: 'companyType', key: 'companyType' },
    { title: '职位', dataIndex: 'title', key: 'title' },
    { title: '汇报给', dataIndex: 'reportingTo', key: 'reportingTo' },
    { title: '管理人数', dataIndex: 'managedCount', key: 'managedCount' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '时间', dataIndex: 'range', key: 'range' },
    { title: '操作', key: 'actions' }
  ]

  const artifactsColumns = [
    { title: '作品名', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      customRender: ({ record }: any) => {
        const url = String(record?.link ?? '').trim()
        return url ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, '查看') : '-'
      }
    },
    { title: '操作', key: 'actions' }
  ]

  const projectsColumns = [
    { title: '项目名', dataIndex: 'name', key: 'name' },
    { title: '定位', dataIndex: 'pitch', key: 'pitch' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '技术栈', dataIndex: 'stack', key: 'stack' },
    { title: '时间', dataIndex: 'range', key: 'range' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const awardsColumns = [
    { title: '奖项', dataIndex: 'name', key: 'name' },
    { title: '机构', dataIndex: 'org', key: 'org' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const honorsColumns = [
    { title: '荣誉', dataIndex: 'name', key: 'name' },
    { title: '机构', dataIndex: 'org', key: 'org' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const achievementsColumns = [
    { title: '成就', dataIndex: 'name', key: 'name' },
    { title: '领域', dataIndex: 'domain', key: 'domain' },
    { title: '结果', dataIndex: 'result', key: 'result' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '操作', key: 'actions' }
  ]

  const skillsColumns = [
    { title: '技能', dataIndex: 'name', key: 'name' },
    {
      title: '熟练度',
      dataIndex: 'level',
      key: 'level',
      customRender: ({ text }: any) => {
        const v = String(text ?? '')
        return skillLevelLabelMap.value[v] ?? v
      }
    },
    { title: '说明', dataIndex: 'note', key: 'note' },
    { title: '操作', key: 'actions' }
  ]

  const languagesColumns = [
    { title: '语言', dataIndex: 'name', key: 'name' },
    {
      title: '水平',
      dataIndex: 'level',
      key: 'level',
      customRender: ({ text }: any) => {
        const v = String(text ?? '')
        return languageLevelLabelMap.value[v] ?? v
      }
    },
    { title: '说明', dataIndex: 'note', key: 'note' },
    { title: '操作', key: 'actions' }
  ]

  const certificatesColumns = [
    { title: '证书', dataIndex: 'name', key: 'name' },
    { title: '机构', dataIndex: 'org', key: 'org' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const goalItemsColumns = [
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '岗位', dataIndex: 'role', key: 'role' },
    { title: '薪资', dataIndex: 'salary', key: 'salary' },
    { title: '操作', key: 'actions' }
  ]

  const jobIntentColumns = [
    { title: '目标岗位', dataIndex: 'targetRole', key: 'targetRole' },
    { title: '行业', dataIndex: 'industries', key: 'industries' },
    {
      title: '方式',
      dataIndex: 'workModes',
      key: 'workModes',
      customRender: ({ record }: any) => {
        const arr = Array.isArray(record?.workModes)
          ? record.workModes
          : typeof record?.workModesText === 'string'
            ? record.workModesText.split(/[,\s/|]+/).filter(Boolean)
            : []
        const labels = arr.map((x: any) => workModeLabelMap.value[String(x ?? '')] ?? String(x ?? '')).filter(Boolean)
        return labels.join(' / ')
      }
    },
    { title: '地域', dataIndex: 'location', key: 'location' },
    { title: '薪资', dataIndex: 'salary', key: 'salary' },
    { title: '操作', key: 'actions' }
  ]

  const speechColumns = [
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    { title: '场合', dataIndex: 'event', key: 'event' },
    { title: '城市/线上', dataIndex: 'location', key: 'location' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const communityColumns = [
    { title: '组织/社区', dataIndex: 'org', key: 'org' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '链接', dataIndex: 'link', key: 'link' },
    { title: '操作', key: 'actions' }
  ]

  const socialColumns = [
    { title: '平台', dataIndex: 'platform', key: 'platform' },
    { title: '账号名', dataIndex: 'account', key: 'account' },
    { title: '链接', dataIndex: 'url', key: 'url' },
    { title: '备注', dataIndex: 'note', key: 'note' },
    { title: '操作', key: 'actions' }
  ]

  const simpleTextColumns = [
    { title: '内容', dataIndex: 'text', key: 'text' },
    { title: '操作', key: 'actions' }
  ]

  const drawerOpen = ref(false)
  const drawerSection = ref('education' as any)
  const drawerMode = ref('create' as any)
  const drawerModel = ref({} as any)

  const drawerTitle = computed(() => {
    const nameMap: Record<string, string> = {
      education: '教育',
      experience: '就职履历',
      artifacts: '作品',
      projects: '项目',
      awards: '奖励',
      honors: '荣誉',
      achievements: '成就',
      certificates: '证书',
      skills: '技能',
      languages: '语言',
      speech: '演讲',
      community: '社区',
      social: '社交媒体',
      strengths: '长处',
      weaknesses: '短处',
      jobIntent: '求职意向',
      personality: '性格特征',
      goalItems: '目标条目',
      jobCandidates: '候选岗位'
    }
    const modeLabel = drawerMode.value === 'create' ? '新建' : '编辑'
    return `${modeLabel}${nameMap[String(drawerSection.value)] ?? ''}`
  })

  const certificateOrgMap = computed(() => {
    const map: Record<string, string> = {}
    const walk = (nodes: any[]) => {
      ;(Array.isArray(nodes) ? nodes : []).forEach((n: any) => {
        const value = String(n?.value ?? '')
        const org = String(n?.org ?? '').trim()
        if (value && org) map[value] = org
        if (Array.isArray(n?.children)) walk(n.children)
      })
    }
    walk(certificateTreeData)
    return map
  })

  function getListRef(section: string) {
    const map: Record<string, any> = {
      education: educationItems,
      experience: experienceItems,
      artifacts: artifactsItems,
      projects: projectsItems,
      awards: awardsItems,
      honors: honorsItems,
      achievements: achievementsItems,
      certificates: certificatesItems,
      skills: skillsItems,
      languages: languagesItems,
      speech: speechItems,
      community: communityItems,
      social: socialItems,
      strengths: strengthsItems,
      weaknesses: weaknessesItems,
      jobIntent: jobIntentItems,
      personality: personalityItems,
      goalItems,
      jobCandidates: jobCandidatesItems
    }
    return map[section]
  }

  function defaultModel(section: string) {
    if (section === 'education')
      return {
        id: makeId(),
        school: '',
        degree: '',
        academicDegree: '',
        eduType: '全日制',
        eduLevel: '',
        campus: '',
        field: '',
        start: '',
        end: '',
        highlights: ''
      }
    if (section === 'experience')
      return {
        id: makeId(),
        company: '',
        companyType: '私企',
        title: '',
        reportingTo: '',
        managedCount: 0,
        location: '',
        start: '',
        end: '',
        highlights: ''
      }
    if (section === 'artifacts')
      return {
        id: makeId(),
        name: '',
        type: '',
        participation: '',
        contribution: '',
        stars: null,
        forks: null,
        description: '',
        primaryAuthor: '',
        coAuthors: '',
        isbn: '',
        isEbook: 'unknown',
        publisher: '',
        publishDate: '',
        printCount: null,
        publishedAt: '',
        link: '',
        note: ''
      }
    if (section === 'projects')
      return {
        id: makeId(),
        name: '',
        pitch: '',
        industry: '',
        type: '开发',
        techStack: [],
        dateRange: [],
        capabilityStack: [],
        stack: '',
        start: '',
        end: '',
        link: '',
        highlights: ''
      }
    if (section === 'awards') return { id: makeId(), name: '', org: '', date: '', link: '', note: '' }
    if (section === 'honors') return { id: makeId(), name: '', org: '', date: '', link: '', note: '' }
    if (section === 'achievements') return { id: makeId(), name: '', domain: '', result: '', date: '', note: '' }
    if (section === 'certificates') return { id: makeId(), name: '', customName: '', org: '', date: '', link: '', note: '' }
    if (section === 'skills') return { id: makeId(), name: '', customName: '', level: 'intermediate', note: '' }
    if (section === 'languages') return { id: makeId(), name: '', level: 'working', note: '' }
    if (section === 'speech') return { id: makeId(), topic: '', event: '', location: '', date: '', link: '', note: '' }
    if (section === 'community') return { id: makeId(), org: '', role: '', date: '', link: '', note: '' }
    if (section === 'social') return { id: makeId(), platform: '', account: '', url: '', note: '' }
    if (section === 'jobIntent') return { id: makeId(), targetRole: '', industries: '', workModes: ['remote'], location: '', salary: '', note: '' }
    if (section === 'goalItems') return { id: makeId(), industry: '', role: '', salary: '' }
    if (section === 'jobCandidates')
      return {
        id: makeId(),
        title: '',
        company: '',
        salary: '',
        location: '',
        source: '',
        url: '',
        publishedAt: '',
        expireAt: '',
        jd: '',
        note: ''
      }
    if (section === 'strengths' || section === 'weaknesses' || section === 'personality') return { id: makeId(), text: '' }
    return { id: makeId() }
  }

  function normalizeModel(section: string, model: any) {
    const result = { ...model }
    if (section === 'education' || section === 'experience') {
      result.range = [result.start, result.end].filter(Boolean).join(' ~ ')
    }
    if (section === 'experience') {
      const ct = String(result.companyType ?? '').trim()
      if (ct === '外资') result.companyType = '外资（其他）'
    }
    if (section === 'projects') {
      const tech = Array.isArray(result.techStack) ? result.techStack : result.techStack ? [result.techStack] : []
      const techText = tech.map((x: any) => String(x ?? '').trim()).filter(Boolean)
      result.techStack = techText
      result.stack = techText.join(' / ')
      const dr = Array.isArray(result.dateRange) ? result.dateRange : []
      result.start = dr?.[0] ?? result.start ?? ''
      result.end = dr?.[1] ?? result.end ?? ''
      result.range = [result.start, result.end].filter(Boolean).join(' ~ ')
      delete result.dateRange
    }
    if (section === 'jobIntent') {
      const fromLegacy = String(result.workMode ?? '').trim()
      const base = Array.isArray(result.workModes) ? result.workModes : fromLegacy ? fromLegacy.split(/[,\s/|]+/).filter(Boolean) : []
      const modes = base.map((x: any) => String(x)).filter(Boolean)
      result.workModes = modes
      result.workModesText = modes.join(' / ')
      delete result.workMode
    }
    if (section === 'certificates') {
      const custom = String(result.customName ?? '').trim()
      if (custom) result.name = custom
      delete result.customName
      const name = String(result.name ?? '').trim()
      const org = String(result.org ?? '').trim()
      if (!org && name) {
        const inferred = String(certificateOrgMap.value[name] ?? '').trim()
        if (inferred) result.org = inferred
      }
    }
    if (section === 'skills') {
      const custom = String(result.customName ?? '').trim()
      if (custom) result.name = custom
      delete result.customName
    }
    if (section === 'jobCandidates') {
      result.title = String(result.title ?? '').trim()
      result.company = String(result.company ?? '').trim()
      result.salary = String(result.salary ?? '').trim()
      result.location = String(result.location ?? '').trim()
      result.source = String(result.source ?? '').trim()
      result.url = String(result.url ?? '').trim()
      result.jd = String(result.jd ?? '').trim()
      result.note = String(result.note ?? '').trim()
      result.publishedAt = formatDateYMD(result.publishedAt)
      result.expireAt = formatDateYMD(result.expireAt)
      result.updatedAt = formatDateYMD(result.updatedAt)
    }
    return result
  }

  function openCreate(section: string) {
    drawerSection.value = section
    drawerMode.value = 'create'
    drawerModel.value = defaultModel(section)
    drawerOpen.value = true
  }

  function openEdit(section: string, record: any) {
    drawerSection.value = section
    drawerMode.value = 'edit'
    if (section === 'projects') {
      const tech = Array.isArray(record?.techStack) ? record.techStack : typeof record?.stack === 'string' ? record.stack.split(/[,\s/|]+/).filter(Boolean) : []
      const start = record?.start ?? ''
      const end = record?.end ?? ''
      drawerModel.value = { ...record, techStack: tech, dateRange: start && end ? [start, end] : [] }
    } else {
      drawerModel.value = { ...record }
    }
    drawerOpen.value = true
  }

  function removeRecord(section: string, id: any) {
    const list = getListRef(section)
    list.value = list.value.filter((x: any) => x.id !== id)
  }

  function saveDrawer() {
    const section = String(drawerSection.value)
    const list = getListRef(section)
    const model = normalizeModel(section, drawerModel.value)
    if (drawerMode.value === 'create') {
      list.value = [{ ...model, id: makeId() }, ...list.value]
    } else {
      list.value = list.value.map((x: any) => (x.id === model.id ? model : x))
    }
    drawerOpen.value = false
  }

  const strengthsTagModel = computed({
    get: () => (Array.isArray(strengthsItems.value) ? strengthsItems.value : []).map((x: any) => String(x?.text ?? '').trim()).filter(Boolean),
    set: (tags: any) => {
      const uniq = normalizeTags(tags)
      strengthsItems.value = uniq.map((t) => ({ id: makeId(), text: t }))
    }
  })

  const weaknessesTagModel = computed({
    get: () => (Array.isArray(weaknessesItems.value) ? weaknessesItems.value : []).map((x: any) => String(x?.text ?? '').trim()).filter(Boolean),
    set: (tags: any) => {
      const uniq = normalizeTags(tags)
      weaknessesItems.value = uniq.map((t) => ({ id: makeId(), text: t }))
    }
  })

  const personalityTagModel = computed({
    get: () => (Array.isArray(personalityItems.value) ? personalityItems.value : []).map((x: any) => String(x?.text ?? '').trim()).filter(Boolean),
    set: (tags: any) => {
      const uniq = normalizeTags(tags)
      personalityItems.value = uniq.map((t) => ({ id: makeId(), text: t }))
    }
  })

  function addStrengthsSelected() {
    const selected = Array.isArray(strengthsQuickSelected.value) ? strengthsQuickSelected.value : []
    if (selected.length === 0) return
    const newItems = selected.map((t: any) => ({ id: makeId(), text: String(t) }))
    strengthsItems.value = [...newItems, ...strengthsItems.value]
    strengthsQuickSelected.value = []
  }

  function addWeaknessesSelected() {
    const selected = Array.isArray(weaknessesQuickSelected.value) ? weaknessesQuickSelected.value : []
    if (selected.length === 0) return
    const newItems = selected.map((t: any) => ({ id: makeId(), text: String(t) }))
    weaknessesItems.value = [...newItems, ...weaknessesItems.value]
    weaknessesQuickSelected.value = []
  }

  function addSkillsSelected() {
    const selectedRaw = Array.isArray(skillsQuickSelected.value) ? skillsQuickSelected.value : []
    const selected = selectedRaw.map((x: any) => String(x ?? '').trim()).filter(Boolean)
    if (selected.length === 0) return
    const existing = new Set((Array.isArray(skillsItems.value) ? skillsItems.value : []).map((x: any) => String(x?.name ?? '').trim()).filter(Boolean))
    const level = String(skillsQuickLevel.value ?? 'intermediate') || 'intermediate'
    const newItems = selected.filter((name) => !existing.has(name)).map((name) => ({ id: makeId(), name, level, note: '' }))
    if (newItems.length === 0) return
    skillsItems.value = [...newItems, ...skillsItems.value]
    skillsQuickSelected.value = []
  }

  const analyzeLoading = ref(false)
  const analyzeError = ref('')
  const analyzeResult = ref<any>(null)
  const smartColumns = [
    { title: '项', dataIndex: 'key', key: 'key' },
    { title: '检查点', dataIndex: 'name', key: 'name' },
    { title: '是否通过', dataIndex: 'pass', key: 'pass' }
  ]

  async function runAnalyze() {
    if (analyzeResult.value) {
      analyzeError.value = ''
      analyzeResult.value = null
      await new Promise((r) => setTimeout(r, 80))
    }
    analyzeError.value = ''
    analyzeLoading.value = true
    try {
      const res = await fetch('/api/analyze', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      analyzeResult.value = await res.json()
    } catch (e: any) {
      analyzeError.value = String(e?.message ?? e)
    } finally {
      analyzeLoading.value = false
    }
  }

  const planLoading = ref(false)
  const planError = ref('')

  async function runPlan() {
    planError.value = ''
    planLoading.value = true
    try {
      const res = await fetch('/api/plan', { method: 'POST' })
      if (!res.ok) {
        let payload: any = null
        try {
          payload = await res.json()
        } catch {
          payload = null
        }
        const msg = String(payload?.message ?? payload?.error ?? '').trim()
        throw new Error(msg ? `${msg}（HTTP ${res.status}）` : `请求失败（HTTP ${res.status}）`)
      }
      const data = await res.json()
      planText.value = JSON.stringify(data, null, 2)
    } catch (e: any) {
      const raw = String(e?.message ?? e ?? '').trim()
      const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false
      if (offline) {
        planError.value = '网络不可用：当前处于离线状态'
      } else if (/failed to fetch/i.test(raw)) {
        planError.value = '请求失败：可能是网络不通，或本地服务未启动（/api/plan 无法访问）'
      } else {
        planError.value = raw || '生成计划失败'
      }
    } finally {
      planLoading.value = false
    }
  }

  const crawlLoading = ref(false)
  const crawlError = ref('')
  const crawlNeedIntent = ref(false)
  const crawlNeedGoals = ref(false)
  const crawlStatus = ref<'idle' | 'running' | 'done' | 'error'>('idle')
  const crawlProgress = ref(0)
  const crawlMessage = ref('')

  const jobCandidatesItems = ref([] as any[])
  const jobCandidatesColumns = [
    { title: '岗位', dataIndex: 'title', key: 'title' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '薪资', dataIndex: 'salary', key: 'salary' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '来源', dataIndex: 'source', key: 'source' },
    { title: '发布日期', dataIndex: 'publishedAt', key: 'publishedAt' },
    { title: '有效期', dataIndex: 'expireAt', key: 'expireAt' },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      customRender: ({ record }: any) => {
        const url = String(record?.url ?? '').trim()
        return url ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, '查看') : '-'
      }
    },
    {
      title: 'JD',
      dataIndex: 'jd',
      key: 'jd',
      customRender: ({ record }: any) => {
        const jd = String(record?.jd ?? '').trim()
        if (!jd) return ''
        return jd.length > 120 ? `${jd.slice(0, 120)}…` : jd
      }
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      customRender: ({ record }: any) => {
        const note = String(record?.note ?? '').trim()
        if (!note) return ''
        return note.length > 120 ? `${note.slice(0, 120)}…` : note
      }
    },
    { title: '操作', key: 'actions' }
  ]

  function normalizeJobCandidateItem(x: any) {
    const item = { id: x?.id ?? makeId(), ...x }
    item.publishedAt = formatDateYMD(item.publishedAt)
    item.expireAt = formatDateYMD(item.expireAt)
    item.updatedAt = formatDateYMD(item.updatedAt)
    return item
  }

  async function loadJobCandidates() {
    try {
      const res = await fetch('/api/outputs/job_candidates.json')
      const data = await res.json()
      jobCandidatesItems.value = Array.isArray(data?.items) ? data.items.map((x: any) => normalizeJobCandidateItem(x)) : []
    } catch {
      jobCandidatesItems.value = []
    }
  }

  async function runCrawl() {
    crawlError.value = ''
    crawlNeedIntent.value = false
    crawlNeedGoals.value = false
    crawlStatus.value = 'running'
    crawlProgress.value = 15
    crawlMessage.value = '正在准备抓取...'
    crawlLoading.value = true
    try {
      const hasIntent = Array.isArray(jobIntentItems.value) && jobIntentItems.value.some((x: any) => String(x?.targetRole ?? '').trim())
      const hasGoalQuery =
        Array.isArray(goalItems.value) && goalItems.value.some((x: any) => String(x?.industry ?? '').trim() || String(x?.role ?? '').trim())

      if (!hasIntent || !hasGoalQuery) {
        const parts = []
        if (!hasIntent) {
          crawlNeedIntent.value = true
          parts.push('请先在「约束 → 求职意向」填写目标岗位/方向')
        }
        if (!hasGoalQuery) {
          crawlNeedGoals.value = true
          parts.push('请先在「目标 → 目标设定」填写至少 1 条目标条目（行业/岗位/薪资）')
        }
        crawlError.value = parts.join('；')
        crawlStatus.value = 'error'
        crawlProgress.value = 0
        crawlMessage.value = ''
        return
      }

      jobCandidatesItems.value = []
      crawlProgress.value = 35
      crawlMessage.value = '正在抓取并整理岗位信息...'
      const res = await fetch('/api/crawl', { method: 'POST' })
      if (!res.ok) {
        let payload: any = null
        try {
          payload = await res.json()
        } catch {
          payload = null
        }
        const msg = String(payload?.message ?? payload?.error ?? '').trim()
        const code = String(payload?.code ?? '').trim()
        const missing = Array.isArray(payload?.missing) ? payload.missing : []
        if (code === 'MISSING_JOB_INTENT' || missing.includes('jobIntent.targetRole')) crawlNeedIntent.value = true
        if (code === 'MISSING_GOAL_ITEMS' || missing.includes('goals.items')) crawlNeedGoals.value = true
        throw new Error(msg ? `${msg}（HTTP ${res.status}）` : `请求失败（HTTP ${res.status}）`)
      }
      const data = await res.json()
      jobCandidatesItems.value = Array.isArray(data?.items) ? data.items.map((x: any) => normalizeJobCandidateItem(x)) : []
      crawlProgress.value = 100
      crawlStatus.value = 'done'
      crawlMessage.value = jobCandidatesItems.value.length ? `已抓取到 ${jobCandidatesItems.value.length} 条候选岗位` : '未抓取到候选岗位（请调整求职意向后再试）'
    } catch (e: any) {
      const raw = String(e?.message ?? e ?? '').trim()
      const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false
      if (offline) {
        crawlError.value = '网络不可用：当前处于离线状态'
      } else if (/failed to fetch/i.test(raw)) {
        crawlError.value = '请求失败：可能是网络不通，或本地服务未启动（/api/crawl 无法访问）'
      } else {
        crawlError.value = raw || '抓取失败'
      }
      crawlStatus.value = 'error'
      crawlProgress.value = 0
      crawlMessage.value = ''
    } finally {
      crawlLoading.value = false
    }
  }

  let watchesReady = false

  async function init() {
    const profileData = await getJson('/api/inputs/profile.json')
    if (profileData && typeof profileData === 'object') {
      profile.value = {
        basics: { ...profile.value.basics, ...(profileData as any).basics },
        summary: String((profileData as any).summary ?? profile.value.summary ?? ''),
        family: {
          ...profile.value.family,
          ...((profileData as any).family ?? {}),
          childrenBirthMonths: Array.isArray((profileData as any).family?.childrenBirthMonths)
            ? (profileData as any).family.childrenBirthMonths.map((x: any) => String(x ?? '').trim())
            : profile.value.family.childrenBirthMonths,
          parents: {
            ...profile.value.family.parents,
            ...(((profileData as any).family ?? {}).parents ?? {})
          }
        },
        preferences: { ...profile.value.preferences, ...((profileData as any).preferences ?? {}) }
      } as any
    }

    const educationData = await getJson('/api/inputs/education.json')
    educationItems.value = withIds(Array.isArray(educationData?.items) ? educationData.items : [])

    const experienceData = await getJson('/api/inputs/experience.json')
    experienceItems.value = withIds(Array.isArray(experienceData?.items) ? experienceData.items : [])

    const artifactsData = await getJson('/api/inputs/artifacts.json')
    artifactsItems.value = withIds(Array.isArray(artifactsData?.items) ? artifactsData.items : [])

    const projectsData = await getJson('/api/inputs/projects.json')
    projectsItems.value = withIds(Array.isArray(projectsData?.items) ? projectsData.items : [])

    const awardsData = await getJson('/api/inputs/awards.json')
    awardsItems.value = withIds(Array.isArray(awardsData?.items) ? awardsData.items : [])

    const honorsData = await getJson('/api/inputs/honors.json')
    honorsItems.value = withIds(Array.isArray(honorsData?.items) ? honorsData.items : [])

    const achievementsData = await getJson('/api/inputs/achievements.json')
    achievementsItems.value = withIds(Array.isArray(achievementsData?.items) ? achievementsData.items : [])

    const certificatesData = await getJson('/api/inputs/certificates.json')
    certificatesItems.value = withIds(Array.isArray(certificatesData?.items) ? certificatesData.items : [])

    const speechData = await getJson('/api/inputs/speech.json')
    speechItems.value = withIds(Array.isArray(speechData?.items) ? speechData.items : [])

    const communityData = await getJson('/api/inputs/community.json')
    communityItems.value = withIds(Array.isArray(communityData?.items) ? communityData.items : [])

    const socialData = await getJson('/api/inputs/social_media.json')
    socialItems.value = withIds(Array.isArray(socialData?.items) ? socialData.items : [])

    const strengthsData = await getJson('/api/inputs/strengths.json')
    strengthsItems.value = withIds(Array.isArray(strengthsData?.items) ? strengthsData.items : [])

    const weaknessesData = await getJson('/api/inputs/weaknesses.json')
    weaknessesItems.value = withIds(Array.isArray(weaknessesData?.items) ? weaknessesData.items : [])

    const skillsData = await getJson('/api/inputs/skills.json')
    skillsItems.value = withIds(Array.isArray(skillsData?.items) ? skillsData.items : [])

    const languagesData = await getJson('/api/inputs/languages.json')
    languagesItems.value = withIds(Array.isArray(languagesData?.items) ? languagesData.items : [])

    const jobIntentData = await getJson('/api/inputs/job_intent.json')
    jobIntentItems.value = withIds(Array.isArray(jobIntentData?.items) ? jobIntentData.items : [])

    const personalityData = await getJson('/api/inputs/personality.json')
    personalityItems.value = withIds(Array.isArray(personalityData?.items) ? personalityData.items : [])

    const goalsData = await getJson('/api/inputs/goals.json')
    if (goalsData && typeof goalsData === 'object') {
      goals.value = {
        timeWindow: String((goalsData as any).timeWindow ?? ''),
        successCriteria: String((goalsData as any).successCriteria ?? '')
      } as any
      goalItems.value = withIds(Array.isArray((goalsData as any).items) ? (goalsData as any).items : [])
    }

    const constraintsData = await getJson('/api/inputs/constraints.json')
    if (constraintsData && typeof constraintsData === 'object') constraints.value = { ...constraints.value, ...(constraintsData as any) } as any

    const hashtag = await getJson('/api/inputs/hashtag.json')
    if (hashtag && typeof hashtag === 'object') {
      hashtagData.value = {
        selected: Array.isArray((hashtag as any).selected) ? (hashtag as any).selected : []
      }
    }

    const plan = await getJson('/api/outputs/plan.json')
    if (plan != null) planText.value = JSON.stringify(plan, null, 2)

    await loadJobCandidates()

    if (!watchesReady) {
      watchesReady = true

      watch(
        profile,
        () => {
          scheduleSave('profile', () => putJson('/api/inputs/profile.json', profile.value))
        },
        { deep: true }
      )
      watch(
        educationItems,
        () => {
          scheduleSave('education', () => putJson('/api/inputs/education.json', { items: educationItems.value }))
        },
        { deep: true }
      )
      watch(
        experienceItems,
        () => {
          scheduleSave('experience', () => putJson('/api/inputs/experience.json', { items: experienceItems.value }))
        },
        { deep: true }
      )
      watch(
        artifactsItems,
        () => {
          scheduleSave('artifacts', () => putJson('/api/inputs/artifacts.json', { items: artifactsItems.value }))
        },
        { deep: true }
      )
      watch(
        projectsItems,
        () => {
          scheduleSave('projects', () => putJson('/api/inputs/projects.json', { items: projectsItems.value }))
        },
        { deep: true }
      )
      watch(
        awardsItems,
        () => {
          scheduleSave('awards', () => putJson('/api/inputs/awards.json', { items: awardsItems.value }))
        },
        { deep: true }
      )
      watch(
        honorsItems,
        () => {
          scheduleSave('honors', () => putJson('/api/inputs/honors.json', { items: honorsItems.value }))
        },
        { deep: true }
      )
      watch(
        achievementsItems,
        () => {
          scheduleSave('achievements', () => putJson('/api/inputs/achievements.json', { items: achievementsItems.value }))
        },
        { deep: true }
      )
      watch(
        certificatesItems,
        () => {
          scheduleSave('certificates', () => putJson('/api/inputs/certificates.json', { items: certificatesItems.value }))
        },
        { deep: true }
      )
      watch(
        speechItems,
        () => {
          scheduleSave('speech', () => putJson('/api/inputs/speech.json', { items: speechItems.value }))
        },
        { deep: true }
      )
      watch(
        communityItems,
        () => {
          scheduleSave('community', () => putJson('/api/inputs/community.json', { items: communityItems.value }))
        },
        { deep: true }
      )
      watch(
        socialItems,
        () => {
          scheduleSave('social', () => putJson('/api/inputs/social_media.json', { items: socialItems.value }))
        },
        { deep: true }
      )
      watch(
        strengthsItems,
        () => {
          scheduleSave('strengths', () => putJson('/api/inputs/strengths.json', { items: strengthsItems.value }))
        },
        { deep: true }
      )
      watch(
        weaknessesItems,
        () => {
          scheduleSave('weaknesses', () => putJson('/api/inputs/weaknesses.json', { items: weaknessesItems.value }))
        },
        { deep: true }
      )
      watch(
        skillsItems,
        () => {
          scheduleSave('skills', () => putJson('/api/inputs/skills.json', { items: skillsItems.value }))
        },
        { deep: true }
      )
      watch(
        languagesItems,
        () => {
          scheduleSave('languages', () => putJson('/api/inputs/languages.json', { items: languagesItems.value }))
        },
        { deep: true }
      )
      watch(
        jobIntentItems,
        () => {
          scheduleSave('jobIntent', () => putJson('/api/inputs/job_intent.json', { items: jobIntentItems.value }))
        },
        { deep: true }
      )
      watch(
        personalityItems,
        () => {
          scheduleSave('personality', () => putJson('/api/inputs/personality.json', { items: personalityItems.value }))
        },
        { deep: true }
      )
      watch(
        goals,
        () => {
          scheduleSave('goals', () => putJson('/api/inputs/goals.json', { ...goals.value, items: goalItems.value }))
        },
        { deep: true }
      )
      watch(
        goalItems,
        () => {
          scheduleSave('goalItems', () => putJson('/api/inputs/goals.json', { ...goals.value, items: goalItems.value }))
        },
        { deep: true }
      )
      watch(
        constraints,
        () => {
          scheduleSave('constraints', () => putJson('/api/inputs/constraints.json', constraints.value))
        },
        { deep: true }
      )
      watch(
        hashtagData,
        () => {
          scheduleSave('hashtag', () => putJson('/api/inputs/hashtag.json', { selected: hashtagData.value.selected }))
        },
        { deep: true }
      )
      watch(
        jobCandidatesItems,
        () => {
          const payload = {
            generatedAt: formatDateYMD(new Date().toISOString()),
            query: null,
            items: Array.isArray(jobCandidatesItems.value) ? jobCandidatesItems.value : []
          }
          scheduleSave('jobCandidates', () => putJson('/api/outputs/job_candidates.json', payload))
        },
        { deep: true }
      )
    }
  }

  return {
    activeKey,
    defaultOpenKeys,
    setActiveKey,
    breadcrumbs,
    profile,
    educationItems,
    experienceItems,
    artifactsItems,
    projectsItems,
    awardsItems,
    honorsItems,
    achievementsItems,
    certificatesItems,
    speechItems,
    communityItems,
    socialItems,
    strengthsItems,
    weaknessesItems,
    skillsItems,
    languagesItems,
    jobIntentItems,
    personalityItems,
    goalItems,
    hashtagData,
    hashtagCategories,
    hashtagFlatOptions,
    addHashtag,
    goals,
    constraints,
    planText,
    planPlaceholder,
    planParseError,
    ganttColumns,
    ganttRows,
    rowKey,
    educationColumns,
    experienceColumns,
    artifactsColumns,
    projectsColumns,
    awardsColumns,
    honorsColumns,
    achievementsColumns,
    certificatesColumns,
    skillsColumns,
    languagesColumns,
    goalItemsColumns,
    jobIntentColumns,
    speechColumns,
    communityColumns,
    socialColumns,
    simpleTextColumns,
    drawerOpen,
    drawerSection,
    drawerMode,
    drawerModel,
    drawerTitle,
    openCreate,
    openEdit,
    removeRecord,
    saveDrawer,
    genderOptions,
    maritalStatusOptions,
    yesNoUnknownOptions,
    lifeStatusOptions,
    degreeOptions,
    academicDegreeOptions,
    educationTypeOptions,
    companyTypeOptions,
    workModeOptions,
    industryOptions,
    strengthsQuickOptions,
    weaknessesQuickOptions,
    strengthsQuickSelected,
    weaknessesQuickSelected,
    skillsQuickSelected,
    skillsQuickLevel,
    addStrengthsSelected,
    addWeaknessesSelected,
    addSkillsSelected,
    skillTreeData,
    skillLevelOptions,
    languageNameOptions,
    languageLevelOptions,
    artifactTypeOptions,
    projectTypeOptions,
    techStackTreeData,
    capabilityStackOptions,
    speechLocationOptions,
    socialPlatformOptions,
    certificateTreeData,
    certificateOrgMap,
    personalityOptions,
    personalityQuickSelected,
    strengthsTagModel,
    weaknessesTagModel,
    personalityTagModel,
    analyzeLoading,
    analyzeError,
    analyzeResult,
    smartColumns,
    runAnalyze,
    planLoading,
    planError,
    runPlan,
    crawlLoading,
    crawlError,
    crawlNeedIntent,
    crawlNeedGoals,
    crawlStatus,
    crawlProgress,
    crawlMessage,
    jobCandidatesItems,
    jobCandidatesColumns,
    runCrawl,
    init
  }
}
