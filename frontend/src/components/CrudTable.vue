<template>
  <a-space style="width: 100%; justify-content: flex-end">
    <a-button type="primary" @click="store.openCreate(section)">{{ createText }}</a-button>
  </a-space>
  <a-table :columns="columns" :dataSource="dataSource" :rowKey="store.rowKey" style="margin-top: 12px">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'actions'">
        <a-space>
          <a-button v-if="section === 'artifacts'" size="small" @click="openDetail(record)">详情</a-button>
          <a-button v-else-if="section === 'experience' || section === 'projects' || section === 'moments'" size="small" @click="openDetail(record)">详情</a-button>
          <a-button size="small" @click="store.openEdit(section, record)">编辑</a-button>
          <a-popconfirm title="确定删除？" @confirm="store.removeRecord(section, record.id)">
            <a-button size="small" danger>删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </template>
  </a-table>

  <a-drawer v-model:open="detailOpen" :title="detailTitle" placement="right" :width="520">
    <a-descriptions bordered size="small" :column="1">
      <a-descriptions-item v-for="f in detailFields" :key="f.key" :label="f.label">
        <template v-if="f.key === 'link'">
          <template v-if="detailRecord?.link">
            <a :href="String(detailRecord.link)" target="_blank" rel="noopener noreferrer">打开链接</a>
          </template>
          <template v-else>-</template>
        </template>
        <template v-else>{{ formatDetailValue(detailRecord?.[f.key]) }}</template>
      </a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()

const props = defineProps<{
  section: string
  columns: any[]
  dataSource: any[]
  createText?: string
}>()

const createText = computed(() => props.createText ?? '新建')

const detailOpen = ref(false)
const detailRecord = ref<any>(null)

function openDetail(record: any) {
  detailRecord.value = record ?? null
  detailOpen.value = true
}

const detailTitle = computed(() => {
  if (props.section === 'artifacts') {
    const name = String(detailRecord.value?.name ?? '').trim()
    return name ? `作品详情：${name}` : '作品详情'
  }
  if (props.section === 'experience') {
    const name = String(detailRecord.value?.company ?? '').trim()
    return name ? `履历详情：${name}` : '履历详情'
  }
  if (props.section === 'projects') {
    const name = String(detailRecord.value?.name ?? '').trim()
    return name ? `项目详情：${name}` : '项目详情'
  }
  if (props.section === 'moments') {
    const name = String(detailRecord.value?.title ?? '').trim()
    return name ? `精彩履历：${name}` : '精彩履历'
  }
  return '详情'
})

const detailFields = computed(() => {
  if (props.section === 'artifacts') {
    const type = String(detailRecord.value?.type ?? '').trim()
    if (type === '开源项目') {
      return [
        { key: 'name', label: '项目名' },
        { key: 'type', label: '类型' },
        { key: 'description', label: '简介' },
        { key: 'stars', label: 'Stars' },
        { key: 'forks', label: 'Forks' },
        { key: 'contribution', label: '贡献方式' },
        { key: 'link', label: '地址' },
        { key: 'note', label: '说明' }
      ]
    }
    if (type === '图书') {
      return [
        { key: 'name', label: '书名' },
        { key: 'type', label: '类型' },
        { key: 'primaryAuthor', label: '主作者' },
        { key: 'coAuthors', label: '其他作者' },
        { key: 'isEbook', label: '电子书' },
        { key: 'isbn', label: 'ISBN' },
        { key: 'publisher', label: '出版社' },
        { key: 'publishDate', label: '出版日期' },
        { key: 'printCount', label: '印刷数量' },
        { key: 'link', label: '链接' },
        { key: 'note', label: '说明' }
      ]
    }
    return [
      { key: 'name', label: '作品名' },
      { key: 'type', label: '类型' },
      { key: 'participation', label: '参与方式' },
      { key: 'contribution', label: '贡献方式' },
      { key: 'publishedAt', label: '发表日期' },
      { key: 'link', label: '链接' },
      { key: 'note', label: '说明' }
    ]
  }
  if (props.section === 'experience') {
    return [
      { key: 'company', label: '公司' },
      { key: 'companyType', label: '公司类型' },
      { key: 'title', label: '职位' },
      { key: 'monthlySalary', label: '月薪(k)' },
      { key: 'reportingTo', label: '汇报给' },
      { key: 'managedCount', label: '管理人数' },
      { key: 'location', label: '地点' },
      { key: 'start', label: '开始时间' },
      { key: 'end', label: '结束时间' },
      { key: 'highlights', label: '亮点' }
    ]
  }
  if (props.section === 'projects') {
    return [
      { key: 'name', label: '项目名' },
      { key: 'pitch', label: '定位' },
      { key: 'industry', label: '行业' },
      { key: 'type', label: '类型' },
      { key: 'techStack', label: '技术栈' },
      { key: 'capabilityStack', label: '能力栈' },
      { key: 'start', label: '开始时间' },
      { key: 'end', label: '结束时间' },
      { key: 'link', label: '链接' },
      { key: 'highlights', label: '亮点' }
    ]
  }
  if (props.section === 'moments') {
    return [
      { key: 'title', label: '标题' },
      { key: 'start', label: '开始时间' },
      { key: 'end', label: '结束时间' },
      { key: 'story', label: '事件描述' },
      { key: 'highlights', label: '亮点' },
      { key: 'toolkit', label: '工具/方法' },
      { key: 'process', label: '流程/方法论' },
      { key: 'evidence', label: '佐证' }
    ]
  }
  return []
})

function formatDetailValue(v: any) {
  if (Array.isArray(v)) return v.filter(Boolean).join(', ') || '-'
  const s = String(v ?? '').trim()
  return s ? s : '-'
}
</script>
