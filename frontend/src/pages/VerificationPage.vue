<template>
  <a-space direction="vertical" style="width: 100%" size="middle">
    <a-alert type="info" show-icon message="这里用于填写“需要验证的问题”的答案（会自动保存到 work/inputs/verification.json），并在分析里用于财务分析与薪资校准。" />

    <a-card title="目标与范围">
      <a-form layout="vertical">
        <a-form-item label="目标城市">
          <a-input v-model:value="model.target.city" placeholder="例如：上海 / 东京 / 深圳" />
        </a-form-item>
        <a-form-item label="目标岗位（可选，默认会参考目标条目）">
          <a-input v-model:value="model.target.role" placeholder="例如：后端工程师 / QA / 产品经理" />
        </a-form-item>
        <a-form-item label="最近更新">
          <a-typography-text type="secondary">{{ model.target.updatedAt || '-' }}</a-typography-text>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="薪资区间（按月，单位 k）">
      <a-form layout="vertical">
        <a-form-item label="税前主流区间（k/月）">
          <a-space style="width: 100%" wrap>
            <a-input-number v-model:value="model.salary.grossMinK" :min="0" :step="1" placeholder="最低" style="width: 160px" />
            <span>~</span>
            <a-input-number v-model:value="model.salary.grossMaxK" :min="0" :step="1" placeholder="最高" style="width: 160px" />
          </a-space>
        </a-form-item>
        <a-form-item label="税后到手区间（k/月，可选）">
          <a-space style="width: 100%" wrap>
            <a-input-number v-model:value="model.salary.netMinK" :min="0" :step="1" placeholder="最低" style="width: 160px" />
            <span>~</span>
            <a-input-number v-model:value="model.salary.netMaxK" :min="0" :step="1" placeholder="最高" style="width: 160px" />
          </a-space>
        </a-form-item>
        <a-form-item label="年终/奖金月数（可选）">
          <a-input-number v-model:value="model.salary.bonusMonths" :min="0" :step="1" placeholder="例如：2 表示约 2 个月" style="width: 240px" />
        </a-form-item>
        <a-form-item label="信息来源（可多条）">
          <a-select v-model:value="model.salary.sources" mode="tags" placeholder="例如：Boss 直聘 / 猎头报价 / 朋友口径 / 薪资报告链接" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="model.salary.notes" :rows="3" placeholder="例如：是否含补贴/加班/期权；是否按 12/13/14 薪；是否税前包社保等" />
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="生活成本（按月，单位 k）">
      <a-form layout="vertical">
        <a-form-item label="房租（k/月）">
          <a-input-number v-model:value="model.cost.rentK" :min="0" :step="0.5" style="width: 240px" />
        </a-form-item>
        <a-form-item label="通勤（k/月）">
          <a-input-number v-model:value="model.cost.commuteK" :min="0" :step="0.2" style="width: 240px" />
        </a-form-item>
        <a-form-item label="餐饮（k/月）">
          <a-input-number v-model:value="model.cost.foodK" :min="0" :step="0.2" style="width: 240px" />
        </a-form-item>
        <a-form-item label="其他（日常/保险/娱乐等，k/月）">
          <a-input-number v-model:value="model.cost.otherK" :min="0" :step="0.2" style="width: 240px" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="model.cost.notes" :rows="3" placeholder="例如：是否合租/独居；通勤方式；医保/商保；一次性搬家成本等" />
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="税费/社保假设（可选）">
      <a-form layout="vertical">
        <a-form-item label="备注">
          <a-textarea v-model:value="model.tax.notes" :rows="4" placeholder="例如：社保缴纳基数/公积金比例；个税专项扣除；是否有租房抵扣；是否含补贴等" />
        </a-form-item>
      </a-form>
    </a-card>
  </a-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()
const model = computed(() => store.verification.value as any)
</script>

