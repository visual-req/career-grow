<template>
  <a-layout-sider theme="light" :width="260">
    <div style="padding: 16px">
      <a-typography-title :level="4" style="margin: 0">个人面板</a-typography-title>
      <a-typography-paragraph type="secondary" style="margin: 8px 0 0">
        简历/作品/社交媒体/履历/长短板
      </a-typography-paragraph>
    </div>
    <a-tree :tree-data="treeData" :selectedKeys="[activeKey]" defaultExpandAll @select="onTreeSelect" />
  </a-layout-sider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()
const activeKey = computed(() => store.activeKey.value)

const treeData = [
  {
    key: 'resume',
    title: '个人简历',
    selectable: false,
    children: [
      {
        key: 'profileGroup',
        title: '个人信息',
        selectable: false,
        children: [
          { key: 'profile', title: '个人信息' },
          { key: 'hashtags', title: '标签' },
          { key: 'skills', title: '技能' },
          { key: 'languages', title: '语言' }
        ]
      },
      {
        key: 'traitsGroup',
        title: '特征',
        selectable: false,
        children: [
          { key: 'strengths', title: '长处/短处' },
          { key: 'personality', title: '性格特征' }
        ]
      },
      {
        key: 'resumeGroup',
        title: '履历',
        selectable: false,
        children: [
          { key: 'education', title: '教育履历' },
          { key: 'experience', title: '就职履历' },
          { key: 'projects', title: '项目履历' }
        ]
      },
      {
        key: 'proofGroup',
        title: '证明材料',
        selectable: false,
        children: [
          { key: 'artifacts', title: '作品' },
          { key: 'awards', title: '奖励' },
          { key: 'honors', title: '荣誉' },
          { key: 'achievements', title: '成就' },
          { key: 'certificates', title: '证书' }
        ]
      },
      {
        key: 'influenceGroup',
        title: '影响力',
        selectable: false,
        children: [
          { key: 'speech', title: '演讲' },
          { key: 'community', title: '社区' },
          { key: 'social', title: '社交媒体' }
        ]
      }
    ]
  },
  {
    key: 'constraintsGroup',
    title: '约束',
    selectable: false,
    children: [
      { key: 'constraints', title: '基本约束' },
      { key: 'jobIntent', title: '求职意向' }
    ]
  },
  {
    key: 'goalGroup',
    title: '目标',
    selectable: false,
    children: [
      { key: 'goals', title: '目标设定' },
      { key: 'goalCandidates', title: '候选' }
    ]
  },
  { key: 'analysis', title: '分析' },
  { key: 'plan', title: '发展计划' }
] as any[]

function onTreeSelect(_: any, info: any) {
  const key = info?.node?.key
  if (typeof key === 'string' && key) store.setActiveKey(key)
}
</script>
