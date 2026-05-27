<template>
  <a-drawer v-model:open="drawerOpen" :title="drawerTitle" placement="right" :width="520">
    <a-form layout="vertical">
      <template v-if="drawerSection === 'education'">
        <a-form-item label="学校">
          <a-input v-model:value="drawerModel.school" />
        </a-form-item>
        <a-form-item label="学历">
          <a-select v-model:value="drawerModel.degree" :options="store.degreeOptions" />
        </a-form-item>
        <a-form-item label="学位（可选）">
          <a-select v-model:value="drawerModel.academicDegree" :options="store.academicDegreeOptions" allow-clear />
        </a-form-item>
        <a-form-item label="学习形式">
          <a-select v-model:value="drawerModel.eduType" :options="store.educationTypeOptions" />
        </a-form-item>
        <a-form-item label="院系/分学院（可选）">
          <a-input v-model:value="drawerModel.campus" placeholder="例如：继续教育学院/网络教育学院/某某分学院" />
        </a-form-item>
        <a-form-item label="层次/细分（可选）">
          <a-input v-model:value="drawerModel.eduLevel" placeholder="例如：留学/专升本/第二学位/双学位" />
        </a-form-item>
        <a-form-item label="专业">
          <a-input v-model:value="drawerModel.field" />
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker v-model:value="drawerModel.start" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker v-model:value="drawerModel.end" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="亮点">
          <a-textarea v-model:value="drawerModel.highlights" :rows="4" placeholder="每行一个要点" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'experience'">
        <a-form-item label="公司">
          <a-input v-model:value="drawerModel.company" />
        </a-form-item>
        <a-form-item label="公司类型">
          <a-select v-model:value="drawerModel.companyType" :options="store.companyTypeOptions" />
        </a-form-item>
        <a-form-item label="职位">
          <a-input v-model:value="drawerModel.title" />
        </a-form-item>
        <a-form-item label="月薪(k)">
          <a-input-number v-model:value="drawerModel.monthlySalary" style="width: 100%" :min="0" :step="1" placeholder="例如：30 表示 30k/月" />
        </a-form-item>
        <a-form-item label="汇报给">
          <a-input v-model:value="drawerModel.reportingTo" />
        </a-form-item>
        <a-form-item label="管理下属人数">
          <a-input-number v-model:value="drawerModel.managedCount" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="drawerModel.location" />
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker v-model:value="drawerModel.start" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker v-model:value="drawerModel.end" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="亮点">
          <a-textarea v-model:value="drawerModel.highlights" :rows="4" placeholder="每行一个要点" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'artifacts'">
        <a-form-item label="作品名">
          <a-input v-model:value="drawerModel.name" />
        </a-form-item>
        <a-form-item label="类型">
          <a-auto-complete v-model:value="drawerModel.type" :options="store.artifactTypeOptions" placeholder="选择或输入作品类型" />
        </a-form-item>
        <a-form-item label="参与方式" v-if="artifactIsBook || artifactIsStandardOrPaper">
          <a-input v-model:value="drawerModel.participation" placeholder="例如：主编/编委/起草人/参与起草/审查/参编" />
        </a-form-item>
        <a-form-item label="贡献方式（开源项目）" v-if="artifactIsOpenSource">
          <a-input v-model:value="drawerModel.contribution" placeholder="例如：PR/Issue/维护者/核心贡献/文档/测试/发布" />
        </a-form-item>
        <a-form-item label="Stars（开源项目）" v-if="artifactIsOpenSource">
          <a-input-number v-model:value="drawerModel.stars" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="Forks（开源项目）" v-if="artifactIsOpenSource">
          <a-input-number v-model:value="drawerModel.forks" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="简介（开源项目）" v-if="artifactIsOpenSource">
          <a-textarea v-model:value="drawerModel.description" :rows="3" />
        </a-form-item>
        <a-form-item label="主作者（图书）" v-if="artifactIsBook">
          <a-input v-model:value="drawerModel.primaryAuthor" />
        </a-form-item>
        <a-form-item label="其他作者（图书）" v-if="artifactIsBook">
          <a-input v-model:value="drawerModel.coAuthors" placeholder="用逗号分隔" />
        </a-form-item>
        <a-form-item label="ISBN（图书）" v-if="artifactIsBook">
          <a-input v-model:value="drawerModel.isbn" placeholder="例如：978-7-XXXX-XXXX-X" />
        </a-form-item>
        <a-form-item label="电子书（图书）" v-if="artifactIsBook">
          <a-select v-model:value="drawerModel.isEbook" :options="store.yesNoUnknownOptions" />
        </a-form-item>
        <a-form-item label="出版社（图书）" v-if="artifactIsBook">
          <a-input v-model:value="drawerModel.publisher" />
        </a-form-item>
        <a-form-item label="出版日期（图书）" v-if="artifactIsBook">
          <a-date-picker v-model:value="drawerModel.publishDate" value-format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
        <a-form-item label="印刷数量（图书）" v-if="artifactIsBook">
          <a-input-number v-model:value="drawerModel.printCount" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="发表日期" v-if="artifactIsContentOrPaper">
          <a-date-picker v-model:value="drawerModel.publishedAt" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'projects'">
        <a-form-item label="项目名">
          <a-input v-model:value="drawerModel.name" />
        </a-form-item>
        <a-form-item label="一句话定位">
          <a-input v-model:value="drawerModel.pitch" />
        </a-form-item>
        <a-form-item label="项目行业">
          <a-select v-model:value="drawerModel.industry" :options="store.industryOptions" show-search allow-clear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="drawerModel.type" :options="store.projectTypeOptions" />
        </a-form-item>
        <a-form-item label="技术栈">
          <a-tree-select
            v-model:value="drawerModel.techStack"
            :tree-data="store.techStackTreeData"
            tree-checkable
            show-search
            allow-clear
            :maxTagCount="8"
            style="width: 100%"
            placeholder="选择技术栈（可多选）"
          />
        </a-form-item>
        <a-form-item label="能力栈">
          <a-select
            v-model:value="drawerModel.capabilityStack"
            mode="multiple"
            :options="store.capabilityStackOptions"
            allow-clear
            show-search
            placeholder="选择能力栈（可多选，例如：敏捷/DevOps/AI）"
          />
        </a-form-item>
        <a-form-item label="开始/结束日期">
          <a-range-picker v-model:value="drawerModel.dateRange" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="亮点">
          <a-textarea v-model:value="drawerModel.highlights" :rows="4" placeholder="每行一个要点" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'moments'">
        <a-form-item label="标题">
          <a-input v-model:value="drawerModel.title" placeholder="一句话概括这段精彩履历" />
        </a-form-item>
        <a-form-item label="开始时间">
          <a-date-picker v-model:value="drawerModel.start" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker v-model:value="drawerModel.end" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="事件描述">
          <a-textarea v-model:value="drawerModel.story" :rows="6" placeholder="发生了什么？你的角色是什么？目标与难点是什么？" />
        </a-form-item>
        <a-form-item label="亮点（每行一个要点）">
          <a-textarea v-model:value="drawerModel.highlights" :rows="6" placeholder="例如：推动跨团队达成一致；关键指标提升；风险控制等" />
        </a-form-item>
        <a-form-item label="工具/方法（可多选）">
          <a-tree-select
            v-model:value="drawerModel.toolkit"
            :tree-data="store.toolkitTreeData"
            tree-checkable
            tree-default-expand-all
            show-search
            allow-clear
            :maxTagCount="8"
            style="width: 100%"
            placeholder="选择你采用的工具/方法"
          />
        </a-form-item>
        <a-form-item label="流程/方法论细节">
          <a-textarea v-model:value="drawerModel.process" :rows="4" placeholder="例如：如何拆解问题、推进协作、做复盘与沉淀" />
        </a-form-item>
        <a-form-item label="佐证（可贴链接/证据点）">
          <a-textarea v-model:value="drawerModel.evidence" :rows="4" placeholder="例如：PRD 链接、数据看板截图说明、复盘文档、PR/Issue 等" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'awards'">
        <a-form-item label="奖项">
          <a-input v-model:value="drawerModel.name" />
        </a-form-item>
        <a-form-item label="主办方/机构">
          <a-input v-model:value="drawerModel.org" />
        </a-form-item>
        <a-form-item label="时间">
          <a-date-picker v-model:value="drawerModel.date" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'certificates'">
        <a-form-item label="证书">
          <a-tree-select
            v-model:value="drawerModel.name"
            :tree-data="store.certificateTreeData"
            tree-default-expand-all
            show-search
            allow-clear
            placeholder="选择证书（支持搜索）"
          />
        </a-form-item>
        <a-form-item label="自定义证书（可选）">
          <a-input v-model:value="drawerModel.customName" placeholder="树里没有时可直接输入，自定义会覆盖上面的选择" />
        </a-form-item>
        <a-form-item label="颁发机构">
          <a-input v-model:value="drawerModel.org" placeholder="选择证书后会自动带出，也可手动修改" />
        </a-form-item>
        <a-form-item label="时间">
          <a-date-picker v-model:value="drawerModel.date" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'skills'">
        <a-form-item label="技能">
          <a-tree-select
            v-model:value="drawerModel.name"
            :tree-data="store.skillTreeData"
            tree-default-expand-all
            show-search
            allow-clear
            placeholder="选择技能（支持搜索）"
          />
        </a-form-item>
        <a-form-item label="自定义技能（可选）">
          <a-input v-model:value="drawerModel.customName" placeholder="树里没有时可直接输入，自定义会覆盖上面的选择" />
        </a-form-item>
        <a-form-item label="熟练度">
          <a-select v-model:value="drawerModel.level" :options="store.skillLevelOptions" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="drawerModel.note" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'tools'">
        <a-form-item label="工具/方法">
          <a-tree-select
            v-model:value="drawerModel.name"
            :tree-data="store.toolkitTreeData"
            tree-default-expand-all
            show-search
            allow-clear
            placeholder="选择工具/方法（支持搜索）"
          />
        </a-form-item>
        <a-form-item label="熟练度">
          <a-select v-model:value="drawerModel.level" :options="store.skillLevelOptions" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="drawerModel.note" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'languages'">
        <a-form-item label="语言">
          <a-auto-complete v-model:value="drawerModel.name" :options="store.languageNameOptions" placeholder="选择或输入语言" />
        </a-form-item>
        <a-form-item label="水平">
          <a-select v-model:value="drawerModel.level" :options="store.languageLevelOptions" />
        </a-form-item>
        <a-form-item label="证书">
          <a-select v-model:value="drawerModel.cert" :options="store.languageCertOptions" allow-clear show-search placeholder="选择语言证书（可选）" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="drawerModel.note" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'speech'">
        <a-form-item label="主题">
          <a-input v-model:value="drawerModel.topic" />
        </a-form-item>
        <a-form-item label="会议/场合">
          <a-input v-model:value="drawerModel.event" />
        </a-form-item>
        <a-form-item label="城市/线上">
          <a-select v-model:value="drawerModel.location" :options="store.speechLocationOptions" allow-clear show-search />
        </a-form-item>
        <a-form-item label="时间">
          <a-date-picker v-model:value="drawerModel.date" value-format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'community'">
        <a-form-item label="组织/社区">
          <a-input v-model:value="drawerModel.org" />
        </a-form-item>
        <a-form-item label="角色">
          <a-input v-model:value="drawerModel.role" />
        </a-form-item>
        <a-form-item label="时间">
          <a-input v-model:value="drawerModel.date" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="贡献/说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'social'">
        <a-form-item label="平台">
          <a-auto-complete v-model:value="drawerModel.platform" :options="store.socialPlatformOptions" placeholder="选择或输入平台" />
        </a-form-item>
        <a-form-item label="账号名">
          <a-input v-model:value="drawerModel.account" placeholder="例如：stephenwang / @xxx" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.url" />
        </a-form-item>
        <a-form-item label="内容标签">
          <a-select
            v-model:value="drawerModel.contentTags"
            mode="tags"
            :options="store.hashtagFlatOptions"
            allow-clear
            show-search
            placeholder="输入或选择标签"
          />
        </a-form-item>
        <a-form-item label="发布内容数量">
          <a-input-number v-model:value="drawerModel.postCount" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="关注者数量">
          <a-input-number v-model:value="drawerModel.followerCount" style="width: 100%" :min="0" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="drawerModel.note" :rows="3" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'jobCandidates'">
        <a-form-item label="岗位">
          <a-input v-model:value="drawerModel.title" />
        </a-form-item>
        <a-form-item label="公司">
          <a-input v-model:value="drawerModel.company" />
        </a-form-item>
        <a-form-item label="薪资">
          <a-input v-model:value="drawerModel.salary" />
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="drawerModel.location" />
        </a-form-item>
        <a-form-item label="来源">
          <a-input v-model:value="drawerModel.source" placeholder="例如：Boss 直聘 / 内推 / 猎头" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.url" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="发布日期">
          <a-date-picker v-model:value="drawerModel.publishedAt" value-format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
        <a-form-item label="有效期">
          <a-date-picker v-model:value="drawerModel.expireAt" value-format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
        <a-form-item label="JD">
          <a-textarea v-model:value="drawerModel.jd" :rows="8" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'jobIntent'">
        <a-form-item label="目标岗位/方向">
          <a-input v-model:value="drawerModel.targetRole" />
        </a-form-item>
        <a-form-item label="目标行业">
          <a-input v-model:value="drawerModel.industries" placeholder="用逗号分隔" />
        </a-form-item>
        <a-form-item label="工作方式">
          <a-select v-model:value="drawerModel.workModes" mode="multiple" :options="store.workModeOptions" />
        </a-form-item>
        <a-form-item label="地域偏好">
          <a-input v-model:value="drawerModel.location" />
        </a-form-item>
        <a-form-item label="薪资期望">
          <a-input v-model:value="drawerModel.salary" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'goalItems'">
        <a-form-item label="行业">
          <a-select v-model:value="drawerModel.industry" :options="store.industryOptions" show-search allow-clear />
        </a-form-item>
        <a-form-item label="岗位">
          <a-input v-model:value="drawerModel.role" placeholder="例如：产品经理 / 测试开发 / 前端工程师" />
        </a-form-item>
        <a-form-item label="薪资">
          <a-input v-model:value="drawerModel.salary" placeholder="例如：35k×14 / 60-80w / 面议" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'honors'">
        <a-form-item label="荣誉">
          <a-input v-model:value="drawerModel.name" />
        </a-form-item>
        <a-form-item label="授予方/机构">
          <a-input v-model:value="drawerModel.org" />
        </a-form-item>
        <a-form-item label="时间">
          <a-date-picker v-model:value="drawerModel.date" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="链接">
          <a-input v-model:value="drawerModel.link" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'achievements'">
        <a-form-item label="成就">
          <a-input v-model:value="drawerModel.name" />
        </a-form-item>
        <a-form-item label="领域/场景">
          <a-input v-model:value="drawerModel.domain" placeholder="例如：测试效率 / 质量 / 交付 / 成本" />
        </a-form-item>
        <a-form-item label="指标/结果">
          <a-input v-model:value="drawerModel.result" placeholder="例如：上线缺陷下降 30%；交付周期缩短 20%" />
        </a-form-item>
        <a-form-item label="时间">
          <a-date-picker v-model:value="drawerModel.date" picker="month" value-format="YYYY-MM" style="width: 100%" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="drawerModel.note" :rows="4" />
        </a-form-item>
      </template>

      <template v-else-if="drawerSection === 'strengths' || drawerSection === 'weaknesses' || drawerSection === 'personality'">
        <a-form-item label="内容">
          <a-textarea v-model:value="drawerModel.text" :rows="6" />
        </a-form-item>
      </template>
    </a-form>

    <template #footer>
      <a-space style="width: 100%; justify-content: flex-end">
        <a-button @click="drawerOpen = false">取消</a-button>
        <a-button type="primary" @click="store.saveDrawer">保存</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()

const drawerTitle = computed(() => store.drawerTitle.value)

const drawerOpen = computed({
  get: () => store.drawerOpen.value,
  set: (v: boolean) => {
    store.drawerOpen.value = v
  }
})

const drawerSection = computed(() => store.drawerSection.value)
const drawerModel = computed(() => store.drawerModel.value as any)

const artifactType = computed(() => String(drawerModel.value?.type ?? '').trim())
const artifactIsOpenSource = computed(() => drawerSection.value === 'artifacts' && artifactType.value === '开源项目')
const artifactIsBook = computed(() => drawerSection.value === 'artifacts' && artifactType.value === '图书')
const artifactIsStandardOrPaper = computed(() => {
  if (drawerSection.value !== 'artifacts') return false
  const t = artifactType.value
  return t === '论文' || t === '行业标准' || t === '团体标准' || t === '企业规范' || t === '专利' || t === '知识产权'
})
const artifactIsContentOrPaper = computed(() => {
  if (drawerSection.value !== 'artifacts') return false
  const t = artifactType.value
  if (t === '论文') return true
  return (
    t === '技术博客' ||
    t === '技术文章' ||
    t === '课程' ||
    t === '视频课' ||
    t === '演讲' ||
    t === 'PPT' ||
    t === '视频' ||
    t === '报告' ||
    t === '白皮书' ||
    t === '作品集网站'
  )
})

watch(
  () => [drawerSection.value, drawerModel.value?.name, drawerModel.value?.customName],
  () => {
    if (drawerSection.value !== 'certificates') return
    const custom = String(drawerModel.value?.customName ?? '').trim()
    if (custom) return
    const name = String(drawerModel.value?.name ?? '').trim()
    const org = String(drawerModel.value?.org ?? '').trim()
    if (!org && name) {
      const inferred = String(store.certificateOrgMap.value?.[name] ?? '').trim()
      if (inferred) drawerModel.value.org = inferred
    }
  }
)

let githubFetchTimer: any = null
watch(
  () => [drawerSection.value, drawerModel.value?.type, drawerModel.value?.link],
  () => {
    if (drawerSection.value !== 'artifacts') return
    if (String(drawerModel.value?.type ?? '').trim() !== '开源项目') return

    const url = String(drawerModel.value?.link ?? '').trim()
    if (!url) return

    if (githubFetchTimer) clearTimeout(githubFetchTimer)
    githubFetchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/github-repo?url=${encodeURIComponent(url)}`)
        if (!res.ok) return
        const data: any = await res.json()
        const stars = Number(data?.stars)
        const forks = Number(data?.forks)
        if (Number.isFinite(stars)) drawerModel.value.stars = stars
        if (Number.isFinite(forks)) drawerModel.value.forks = forks
        const desc = String(data?.description ?? '').trim()
        if (desc && !String(drawerModel.value?.description ?? '').trim()) drawerModel.value.description = desc
        const name = String(data?.name ?? '').trim()
        if (name && !String(drawerModel.value?.name ?? '').trim()) drawerModel.value.name = name
      } catch {
        return
      }
    }, 450)
  }
)
</script>
