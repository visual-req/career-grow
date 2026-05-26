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
    <a-alert v-if="planParseError" type="warning" :message="planParseError" show-icon />
    <a-alert v-else-if="echartsMissing" type="warning" message="ECharts 未加载，请检查网络或 CDN" show-icon />
    <a-empty v-else-if="tasks.length === 0" description="暂无里程碑" />
    <div v-else ref="chartEl" style="height: 420px; width: 100%" />
  </a-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()

const planLoading = computed(() => store.planLoading.value)
const planError = computed(() => store.planError.value)
const planParseError = computed(() => store.planParseError.value)
const ganttRows = computed(() => store.ganttRows.value)

const echartsMissing = ref(false)

const tasks = computed(() => {
  const rows = Array.isArray(ganttRows.value) ? ganttRows.value : []
  return rows
    .map((t: any) => {
      const name = String(t?.name ?? '').trim()
      const start = String(t?.start ?? '').trim()
      const end = String(t?.end ?? '').trim()
      const startT = new Date(start).getTime()
      const endT = new Date(end).getTime()
      return { id: t?.id, name, start, end, startT, endT }
    })
    .filter((t: any) => t.name && Number.isFinite(t.startT) && Number.isFinite(t.endT) && t.endT >= t.startT)
    .sort((a: any, b: any) => a.startT - b.startT)
})

const chartEl = ref<HTMLDivElement | null>(null)
let chart: any = null
let resizeHandler: (() => void) | null = null

function setChartOption() {
  if (!chart) return
  const echartsAny = (window as any).echarts
  if (!echartsAny) return
  const list = tasks.value
  if (!list.length) return

  const categories = list.map((t) => t.name)
  const data = list.map((t, idx) => [t.startT, t.endT, idx, t.name, t.start, t.end])

  chart.setOption(
    {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          const v = Array.isArray(p?.value) ? p.value : []
          const name = String(v?.[3] ?? p?.name ?? '')
          const start = String(v?.[4] ?? '')
          const end = String(v?.[5] ?? '')
          return `${name}<br/>${start} ~ ${end}`
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
  if (!chartEl.value) return
  const echartsAny = (window as any).echarts
  if (!echartsAny) {
    echartsMissing.value = true
    return
  }
  echartsMissing.value = false
  chart = echartsAny.init(chartEl.value)
  setChartOption()
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
  () => [planParseError.value, tasks.value],
  () => {
    if (!chart) return
    if (planParseError.value || tasks.value.length === 0) {
      chart.clear()
      return
    }
    setChartOption()
  },
  { deep: true }
)
</script>
