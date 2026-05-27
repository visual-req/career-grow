<template>
  <a-form layout="vertical">
    <a-form-item label="每周可投入时间（小时）">
      <a-input-number v-model:value="constraints.hoursPerWeek" style="width: 100%" :min="0" />
    </a-form-item>
    <a-form-item label="地域/工作方式偏好">
      <a-input v-model:value="constraints.geoAndMode" placeholder="例如：上海/远程/混合" />
    </a-form-item>
    <a-form-item label="住房情况">
      <a-space wrap>
        <a-select
          v-model:value="constraints.housingType"
          style="width: 180px"
          :options="[
            { label: '未知', value: 'unknown' },
            { label: '租房', value: 'rent' },
            { label: '自有房', value: 'own' }
          ]"
        />
        <a-select
          v-if="constraints.housingType === 'rent'"
          v-model:value="constraints.rentType"
          style="width: 180px"
          :options="[
            { label: '未知', value: 'unknown' },
            { label: '合租', value: 'shared' },
            { label: '独居', value: 'alone' }
          ]"
        />
      </a-space>
    </a-form-item>
    <a-form-item label="通勤方式">
      <a-select
        v-model:value="constraints.commuteMode"
        :options="[
          { label: '未知', value: 'unknown' },
          { label: '公交/地铁', value: 'metro_bus' },
          { label: '打车', value: 'taxi' },
          { label: '自驾', value: 'drive' }
        ]"
      />
    </a-form-item>
    <a-form-item label="其他约束">
      <a-textarea v-model:value="constraints.notes" :rows="4" placeholder="例如：只能晚上学习；不考虑加班强度过高的行业" />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()
const constraints = computed(() => store.constraints.value as any)
</script>
