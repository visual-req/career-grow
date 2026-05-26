<template>
  <a-space direction="vertical" style="width: 100%" size="middle">
    <a-card title="目标设定">
      <a-form layout="vertical">
        <a-form-item label="时间窗口">
          <a-input v-model:value="goals.timeWindow" placeholder="例如：8 周 / 3 个月" />
        </a-form-item>
        <a-form-item label="成功标准">
          <a-textarea v-model:value="goals.successCriteria" :rows="4" placeholder="例如：投递 50 家，拿到 5 次面试，2 个可展示项目" />
        </a-form-item>
      </a-form>

      <a-space style="width: 100%; justify-content: flex-end">
        <a-button type="primary" @click="store.openCreate('goalItems')">新增目标条目</a-button>
      </a-space>
      <a-table :columns="store.goalItemsColumns" :dataSource="goalItems" :rowKey="store.rowKey" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="store.openEdit('goalItems', record)">编辑</a-button>
              <a-popconfirm title="确定删除？" @confirm="store.removeRecord('goalItems', record.id)">
                <a-button size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()
const goals = computed(() => store.goals.value as any)
const goalItems = computed(() => store.goalItems.value)
</script>

