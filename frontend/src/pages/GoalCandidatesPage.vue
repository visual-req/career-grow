<template>
  <a-space style="width: 100%; justify-content: space-between" wrap>
    <a-space wrap>
      <a-typography-text type="secondary">当前不内置网站爬虫抓取，请手动维护候选岗位（可粘贴岗位链接、JD 与备注）。</a-typography-text>
    </a-space>
    <a-button type="link" @click="helpOpen = true">查询岗位要领</a-button>
  </a-space>

  <CrudTable section="jobCandidates" :columns="store.jobCandidatesColumns" :dataSource="jobCandidatesItems" createText="新增候选岗位" />

  <a-drawer v-model:open="helpOpen" title="查询岗位要领" placement="right" :width="520">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <a-alert type="info" show-icon message="建议在招聘网站完成检索后，把岗位链接与 JD 复制到这里做结构化管理与筛选。" />
      <a-list
        bordered
        size="small"
        :dataSource="helpItems"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item style="white-space: pre-wrap">{{ item }}</a-list-item>
        </template>
      </a-list>
    </a-space>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCareerStore } from '../store/careerStore'
import CrudTable from '../components/CrudTable.vue'

const store = useCareerStore()

const jobCandidatesItems = computed(() => store.jobCandidatesItems.value)

const helpOpen = ref(false)
const helpItems = [
  '1) 先明确目标：岗位关键词（2-3 个）、行业/领域、城市、薪资区间、工作方式（远程/混合/现场）。',
  '2) 用“主关键词 + 同义词”组合搜索：例如「测试开发 / SDET / QA 自动化 / 质量工程」。',
  '3) 先用条件收敛，再用关键词精确：城市/年限/学历/薪资等先筛掉不可能的范围。',
  '4) 看 JD 的 3 个层级：必须项（硬门槛）、加分项（可补齐）、隐性偏好（行业/域知识/沟通协作）。',
  '5) 识别“伪高薪/伪标题”：明确工资结构（13/14/16 薪、奖金、补贴）、加班强度与试用期规则。',
  '6) 关注岗位的“交付物”：你能否用项目/作品/指标去证明（如：缺陷下降、效率提升、成本降低）。',
  '7) 建议把候选岗位的链接、JD、要点备注（亮点/风险/面试点/薪资结构）录入到这里，方便后续筛选与复盘。'
]
</script>
