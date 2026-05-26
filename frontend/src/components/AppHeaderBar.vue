<template>
  <a-card :bodyStyle="{ padding: '12px 16px' }">
    <a-space style="width: 100%; justify-content: space-between">
      <a-typography-title :level="4" style="margin: 0">我的职业发展</a-typography-title>
      <a-breadcrumb>
        <a-breadcrumb-item v-for="(b, idx) in breadcrumbs" :key="idx">{{ b }}</a-breadcrumb-item>
      </a-breadcrumb>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()
const breadcrumbs = computed(() => store.breadcrumbs.value)
</script>
