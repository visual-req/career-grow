<template>
  <a-space style="width: 100%; justify-content: space-between" wrap>
    <a-space direction="vertical" size="small">
      <a-typography-title :level="4" style="margin: 0">发展计划</a-typography-title>
      <a-typography-paragraph type="secondary" style="margin: 0">
        该模块对应 work/outputs/plan.json。
      </a-typography-paragraph>
    </a-space>
    <a-button type="primary" :loading="planLoading" @click="store.runPlan">生成计划</a-button>
  </a-space>
  <a-card title="甘特图" style="margin-bottom: 12px">
    <a-alert v-if="planError" type="error" :message="planError" show-icon style="margin-bottom: 8px" />
    <a-space v-if="planLoading" direction="vertical" style="width: 100%; margin-bottom: 8px" size="small">
      <a-progress :percent="planProgress" size="small" />
      <a-typography-text type="secondary">{{ planMessage || '正在生成...' }}</a-typography-text>
    </a-space>
    <a-alert
      v-else-if="planStatus === 'done'"
      type="success"
      :message="`计划有效：里程碑 ${planStats.totalMilestones} 条（可渲染 ${planStats.validMilestones} 条）`"
      show-icon
      style="margin-bottom: 8px"
    />
    <a-alert
      v-else-if="planStatus === 'error'"
      type="warning"
      message="生成计划失败或无效，请检查错误信息与数据有效性"
      show-icon
      style="margin-bottom: 8px"
    />
    <a-alert v-if="planParseError" type="warning" :message="planParseError" show-icon />
    <a-alert v-else-if="echartsMissing" type="warning" message="ECharts 未加载，请检查网络或 CDN" show-icon />
    <a-empty v-else-if="tasks.length === 0" description="暂无里程碑" />
    <div v-else ref="chartEl" style="height: 420px; width: 100%" />
    <a-list
      v-if="planValidityIssues.length"
      size="small"
      bordered
      :dataSource="planValidityIssues"
      style="margin-top: 12px"
    >
      <template #header>有效性检查</template>
      <template #renderItem="{ item }">
        <a-list-item>{{ item }}</a-list-item>
      </template>
    </a-list>

    <a-divider orientation="left" style="margin: 12px 0">Todo</a-divider>
    <a-table
      :columns="todoColumns"
      :dataSource="todos"
      :pagination="false"
      rowKey="id"
      size="small"
      :locale="{ emptyText: '暂无 Todo' }"
    />
  </a-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()

const planLoading = computed(() => store.planLoading.value)
const planError = computed(() => store.planError.value)
const planStatus = computed(() => store.planStatus.value)
const planProgress = computed(() => store.planProgress.value)
const planMessage = computed(() => store.planMessage.value)
const planParseError = computed(() => store.planParseError.value)
const ganttRows = computed(() => store.ganttRows.value)
const planText = computed(() => store.planText.value)

const echartsMissing = ref(false)

const planStats = computed(() => {
  const raw = String(planText.value ?? '').trim()
  if (!raw) return { totalMilestones: 0, validMilestones: 0 }
  let obj: any = null
  try {
    obj = JSON.parse(raw)
  } catch {
    return { totalMilestones: 0, validMilestones: 0 }
  }
  const ms = Array.isArray(obj?.milestones) ? obj.milestones : []
  return { totalMilestones: ms.length, validMilestones: tasks.value.length }
})

const planValidityIssues = computed(() => {
  const issues: string[] = []
  const raw = String(planText.value ?? '').trim()
  if (!raw) return issues
  let obj: any = null
  try {
    obj = JSON.parse(raw)
  } catch {
    issues.push('plan.json 不是合法 JSON')
    return issues
  }
  const ms = Array.isArray(obj?.milestones) ? obj.milestones : []
  if (!ms.length) issues.push('milestones 为空')
  ms.slice(0, 30).forEach((m: any, idx: number) => {
    const name = String(m?.name ?? m?.title ?? '').trim() || `#${idx + 1}`
    const start = String(m?.start ?? '').trim()
    const end = String(m?.end ?? '').trim()
    const sT = new Date(start).getTime()
    const eT = new Date(end).getTime()
    if (!start || !end) issues.push(`${name}：缺少开始或结束日期`)
    else if (!Number.isFinite(sT) || !Number.isFinite(eT)) issues.push(`${name}：日期格式不可解析（start/end 建议 YYYY-MM-DD）`)
    else if (eT < sT) issues.push(`${name}：结束日期早于开始日期`)
  })
  if (ms.length > tasks.value.length) issues.push(`存在不可渲染里程碑：${ms.length - tasks.value.length} 条（检查日期格式/空值）`)
  return issues
})

const tasks = computed(() => {
  const rows = Array.isArray(ganttRows.value) ? ganttRows.value : []
  return rows
    .map((t: any) => {
      const name = String(t?.name ?? '').trim()
      const start = String(t?.start ?? '').trim()
      const end = String(t?.end ?? '').trim()
      const startT = new Date(start).getTime()
      const endT = new Date(end).getTime()
      const objective = String(t?.objective ?? '').trim()
      const deliverables = Array.isArray(t?.deliverables) ? t.deliverables : []
      const acceptanceCriteria = Array.isArray(t?.acceptanceCriteria) ? t.acceptanceCriteria : []
      return { id: t?.id, name, start, end, startT, endT, objective, deliverables, acceptanceCriteria }
    })
    .filter((t: any) => t.name && Number.isFinite(t.startT) && Number.isFinite(t.endT) && t.endT >= t.startT)
    .sort((a: any, b: any) => a.startT - b.startT)
})

const todos = computed(() => {
  const raw = String(planText.value ?? '').trim()
  if (!raw) return []
  let obj: any = null
  try {
    obj = JSON.parse(raw)
  } catch {
    return []
  }
  const list = Array.isArray(obj?.todos) ? obj.todos : []
  const ms = Array.isArray(obj?.milestones) ? obj.milestones : []
  const milestoneMap: Record<string, string> = {}
  ms.forEach((m: any) => {
    const id = String(m?.id ?? '').trim()
    const name = String(m?.name ?? m?.title ?? '').trim()
    if (id) milestoneMap[id] = name || id
  })
  return list
    .map((x: any) => {
      const id = String(x?.id ?? '').trim() || String(Math.random())
      const milestoneId = String(x?.milestoneId ?? '').trim()
      return {
        id,
        title: String(x?.title ?? '').trim(),
        milestoneId,
        milestoneName: milestoneMap[milestoneId] ?? milestoneId,
        due: String(x?.due ?? '').trim(),
        priority: String(x?.priority ?? '').trim(),
        status: String(x?.status ?? '').trim(),
        evidence: String(x?.evidence ?? '').trim()
      }
    })
    .filter((x: any) => x.title)
})

const todoColumns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '关联里程碑', dataIndex: 'milestoneName', key: 'milestoneName' },
  { title: '截止', dataIndex: 'due', key: 'due' },
  { title: '优先级', dataIndex: 'priority', key: 'priority' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '验收/产出', dataIndex: 'evidence', key: 'evidence' }
]

const chartEl = ref<HTMLDivElement | null>(null)
let chart: any = null
let resizeHandler: (() => void) | null = null

function setChartOption() {
  const echartsAny = (window as any).echarts
  if (!echartsAny) {
    echartsMissing.value = true
    return
  }
  echartsMissing.value = false
  if (!chart || !chartEl.value) return
  const list = tasks.value
  if (!list.length) return

  const categories = list.map((t) => t.name)
  const data = list.map((t, idx) => [
    t.startT,
    t.endT,
    idx,
    t.name,
    t.start,
    t.end,
    t.objective,
    Array.isArray(t.deliverables) ? t.deliverables.join('；') : '',
    Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria.join('；') : ''
  ])

  chart.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          const v = Array.isArray(p?.value) ? p.value : []
          const name = String(v?.[3] ?? p?.name ?? '')
          const start = String(v?.[4] ?? '')
          const end = String(v?.[5] ?? '')
          const objective = String(v?.[6] ?? '').trim()
          const deliverables = String(v?.[7] ?? '').trim()
          const acceptance = String(v?.[8] ?? '').trim()
          const lines = [`${name}`, `${start} ~ ${end}`]
          if (objective) lines.push(`目标：${objective}`)
          if (deliverables) lines.push(`产出：${deliverables}`)
          if (acceptance) lines.push(`验收：${acceptance}`)
          return lines.join('<br/>')
        }
      },
      grid: { left: 140, right: 24, top: 18, bottom: 24, containLabel: true },
      xAxis: {
        type: 'time',
        axisLabel: { formatter: (v: any) => echartsAny.format.formatTime('yyyy-MM-dd', v) }
      },
      yAxis: { type: 'category', data: categories, inverse: true, axisLabel: { width: 120, overflow: 'truncate' } },
      series: [
        {
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const yIdx = api.value(2)
            const start = api.coord([api.value(0), yIdx])
            const end = api.coord([api.value(1), yIdx])
            const height = api.size([0, 1])[1] * 0.6
            const rectShape = echartsAny.graphic.clipRectByRect(
              {
                x: start[0],
                y: start[1] - height / 2,
                width: end[0] - start[0],
                height
              },
              {
                x: params.coordSys.x,
                y: params.coordSys.y,
                width: params.coordSys.width,
                height: params.coordSys.height
              }
            )
            return rectShape ? { type: 'rect', shape: rectShape, style: api.style({ fill: '#1677ff' }) } : null
          },
          encode: { x: [0, 1], y: 2 },
          data
        }
      ]
    },
    true
  )
}

onMounted(() => {
  resizeHandler = () => chart?.resize()
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  resizeHandler = null
  chart?.dispose()
  chart = null
})

watch(
  () => [planParseError.value, tasks.value, chartEl.value],
  () => {
    const echartsAny = (window as any).echarts
    if (planParseError.value || tasks.value.length === 0) {
      chart?.clear()
      if (chart) {
        chart.dispose()
        chart = null
      }
      return
    }
    if (!echartsAny) {
      echartsMissing.value = true
      return
    }
    echartsMissing.value = false
    if (!chartEl.value) return
    if (!chart) chart = echartsAny.init(chartEl.value)
    setChartOption()
  },
  { deep: true }
)
</script>
