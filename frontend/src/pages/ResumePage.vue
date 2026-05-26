<template>
  <template v-if="activeKey === 'profile'">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <a-alert
        type="warning"
        show-icon
        message="您填写的内容将会提交到 AI 平台，有泄露的风险，请谨慎操作。请避免填写身份证号、银行卡号等敏感信息。"
      />
      <a-card>
        <a-descriptions bordered size="middle" :column="2">
          <a-descriptions-item label="姓名">
            <a-input v-model:value="profile.basics.name" />
          </a-descriptions-item>
          <a-descriptions-item label="性别">
            <a-select v-model:value="profile.basics.gender" :options="store.genderOptions" />
          </a-descriptions-item>
          <a-descriptions-item label="婚否">
            <a-select v-model:value="profile.basics.maritalStatus" :options="store.maritalStatusOptions" />
          </a-descriptions-item>
          <a-descriptions-item label="出生年月">
            <a-input v-model:value="profile.basics.birthMonth" placeholder="例如：1992-08" />
          </a-descriptions-item>
          <a-descriptions-item label="工作年限">
            <a-input-number v-model:value="profile.basics.yearsOfExperience" style="width: 100%" :min="0" />
          </a-descriptions-item>
          <a-descriptions-item label="当前岗位">
            <a-input v-model:value="profile.basics.currentTitle" />
          </a-descriptions-item>
          <a-descriptions-item label="所在城市">
            <a-input v-model:value="profile.basics.location" />
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="家庭与保障">
        <a-space direction="vertical" style="width: 100%" size="middle">
          <a-space style="width: 100%; justify-content: space-between">
            <a-typography-text>子女</a-typography-text>
            <a-button type="primary" size="small" @click="addChild">新增</a-button>
          </a-space>
          <a-table :columns="childrenColumns" :dataSource="childrenRows" :pagination="false" rowKey="key" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'birthMonth'">
                <a-input
                  :value="record.birthMonth"
                  placeholder="例如：2019-06"
                  @update:value="(v: string) => updateChildBirthMonth(record.key, v)"
                />
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-popconfirm title="确定删除？" @confirm="removeChild(record.key)">
                  <a-button size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>

          <a-typography-text style="margin-top: 8px">父母</a-typography-text>
          <a-table :columns="parentsColumns" :dataSource="parentsRows" :pagination="false" rowKey="key" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'birthMonth'">
                <a-input
                  :value="record.birthMonth"
                  placeholder="例如：1962-03"
                  @update:value="(v: string) => updateParentBirthMonth(record.key, v)"
                />
              </template>
              <template v-else-if="column.key === 'lifeStatus'">
                <a-select
                  :value="record.lifeStatus"
                  :options="store.lifeStatusOptions"
                  style="width: 100%"
                  @update:value="(v: string) => updateParentLifeStatus(record.key, v)"
                />
              </template>
              <template v-else-if="column.key === 'pension'">
                <a-select
                  :value="record.hasPension"
                  :options="store.yesNoUnknownOptions"
                  style="width: 100%"
                  @update:value="(v: string) => updateParentPension(record.key, v)"
                />
              </template>
            </template>
          </a-table>

          <a-form layout="vertical">
            <a-form-item label="社保缴纳年限">
              <a-input-number v-model:value="profile.family.socialSecurityYears" style="width: 100%" :min="0" :max="80" />
            </a-form-item>
          </a-form>
        </a-space>
      </a-card>

      <a-card title="个人摘要">
        <a-textarea v-model:value="profile.summary" :rows="6" placeholder="用 3-6 句描述你的定位、优势与方向" />
      </a-card>
    </a-space>
  </template>

  <template v-else-if="activeKey === 'hashtags'">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <a-card title="快速输入">
        <a-form layout="vertical">
          <a-form-item label="我的标签（可直接输入，也可从下方推荐点击添加）">
            <a-select v-model:value="hashtagData.selected" mode="tags" :options="hashtagFlatOptions" placeholder="例如：#产品经理 #测试开发 #云原生" />
          </a-form-item>
        </a-form>
      </a-card>

      <a-card title="推荐标签">
        <a-collapse>
          <a-collapse-panel v-for="c in store.hashtagCategories" :key="c.name" :header="c.name">
            <a-space wrap>
              <a-tag v-for="t in c.tags" :key="t" style="cursor: pointer" @click="store.addHashtag(t)">{{ t }}</a-tag>
            </a-space>
          </a-collapse-panel>
        </a-collapse>
      </a-card>
    </a-space>
  </template>

  <template v-else-if="activeKey === 'skills'">
    <a-card title="技能快捷输入" style="margin-bottom: 12px">
      <a-form layout="vertical">
        <a-form-item label="选择技能（可多选，支持搜索）">
          <a-tree-select
            v-model:value="skillsQuickSelectedModel"
            :tree-data="store.skillTreeData"
            tree-checkable
            show-search
            allow-clear
            :maxTagCount="6"
            style="width: 100%"
            placeholder="从树里勾选，也可以搜索"
          />
        </a-form-item>
        <a-form-item label="默认熟练度">
          <a-select v-model:value="skillsQuickLevelModel" :options="store.skillLevelOptions" />
        </a-form-item>
        <a-space>
          <a-button type="primary" @click="store.addSkillsSelected">添加为条目</a-button>
          <a-typography-text type="secondary">已存在的技能会自动跳过</a-typography-text>
        </a-space>
      </a-form>
    </a-card>
    <CrudTable section="skills" :columns="store.skillsColumns" :dataSource="skillsItems" />
  </template>

  <template v-else-if="activeKey === 'languages'">
    <CrudTable section="languages" :columns="store.languagesColumns" :dataSource="languagesItems" />
  </template>

  <template v-else-if="activeKey === 'education'">
    <CrudTable section="education" :columns="store.educationColumns" :dataSource="educationItems" />
  </template>

  <template v-else-if="activeKey === 'experience'">
    <CrudTable section="experience" :columns="store.experienceColumns" :dataSource="experienceItems" />
  </template>

  <template v-else-if="activeKey === 'projects'">
    <CrudTable section="projects" :columns="store.projectsColumns" :dataSource="projectsItems" />
  </template>

  <template v-else-if="activeKey === 'artifacts'">
    <CrudTable section="artifacts" :columns="store.artifactsColumns" :dataSource="artifactsItems" />
  </template>

  <template v-else-if="activeKey === 'awards'">
    <CrudTable section="awards" :columns="store.awardsColumns" :dataSource="awardsItems" />
  </template>

  <template v-else-if="activeKey === 'honors'">
    <CrudTable section="honors" :columns="store.honorsColumns" :dataSource="honorsItems" />
  </template>

  <template v-else-if="activeKey === 'achievements'">
    <CrudTable section="achievements" :columns="store.achievementsColumns" :dataSource="achievementsItems" />
  </template>

  <template v-else-if="activeKey === 'certificates'">
    <CrudTable section="certificates" :columns="store.certificatesColumns" :dataSource="certificatesItems" />
  </template>

  <template v-else-if="activeKey === 'speech'">
    <CrudTable section="speech" :columns="store.speechColumns" :dataSource="speechItems" />
  </template>

  <template v-else-if="activeKey === 'community'">
    <CrudTable section="community" :columns="store.communityColumns" :dataSource="communityItems" />
  </template>

  <template v-else-if="activeKey === 'social'">
    <CrudTable section="social" :columns="store.socialColumns" :dataSource="socialItems" />
  </template>

  <template v-else-if="activeKey === 'jobIntent'">
    <CrudTable section="jobIntent" :columns="store.jobIntentColumns" :dataSource="jobIntentItems" />
  </template>

  <template v-else-if="activeKey === 'strengths'">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <a-card title="长处（魔方标签）" :bordered="false">
        <a-form layout="vertical">
          <a-form-item label="已选">
            <a-space wrap v-if="strengthsTags.length">
              <a-tag v-for="t in strengthsTags" :key="t" closable @close="removeStrengthTag(t)">{{ t }}</a-tag>
            </a-space>
            <a-empty v-else description="暂无" />
          </a-form-item>
          <a-form-item label="新增（输入后回车）">
            <a-input v-model:value="strengthsNewTag" placeholder="例如：结构化思维" @pressEnter="addStrengthTag()" />
          </a-form-item>
          <a-form-item label="候选（点击添加/取消）">
            <a-space wrap>
              <a-tag
                v-for="o in store.strengthsQuickOptions"
                :key="o.value"
                style="cursor: pointer"
                :color="strengthsTags.includes(o.value) ? 'blue' : undefined"
                @click="toggleStrengthTag(o.value)"
              >
                {{ o.label }}
              </a-tag>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <a-card title="短处（魔方标签）" :bordered="false">
        <a-form layout="vertical">
          <a-form-item label="已选">
            <a-space wrap v-if="weaknessesTags.length">
              <a-tag v-for="t in weaknessesTags" :key="t" closable @close="removeWeaknessTag(t)">{{ t }}</a-tag>
            </a-space>
            <a-empty v-else description="暂无" />
          </a-form-item>
          <a-form-item label="新增（输入后回车）">
            <a-input v-model:value="weaknessesNewTag" placeholder="例如：容易焦虑" @pressEnter="addWeaknessTag()" />
          </a-form-item>
          <a-form-item label="候选（点击添加/取消）">
            <a-space wrap>
              <a-tag
                v-for="o in store.weaknessesQuickOptions"
                :key="o.value"
                style="cursor: pointer"
                :color="weaknessesTags.includes(o.value) ? 'blue' : undefined"
                @click="toggleWeaknessTag(o.value)"
              >
                {{ o.label }}
              </a-tag>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>
    </a-space>
  </template>

  <template v-else-if="activeKey === 'personality'">
    <a-card title="性格特征（魔方标签）">
      <a-form layout="vertical">
        <a-form-item label="已选">
          <a-space wrap v-if="personalityTags.length">
            <a-tag v-for="t in personalityTags" :key="t" closable @close="removePersonalityTag(t)">{{ t }}</a-tag>
          </a-space>
          <a-empty v-else description="暂无" />
        </a-form-item>
        <a-form-item label="新增（输入后回车）">
          <a-input v-model:value="personalityNewTag" placeholder="例如：抗压能力强" @pressEnter="addPersonalityTag()" />
        </a-form-item>
        <a-form-item label="候选（点击添加/取消）">
          <a-space wrap>
            <a-tag
              v-for="o in store.personalityOptions"
              :key="o.value"
              style="cursor: pointer"
              :color="personalityTags.includes(o.value) ? 'blue' : undefined"
              @click="togglePersonalityTag(o.value)"
            >
              {{ o.label }}
            </a-tag>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCareerStore } from '../store/careerStore'
import CrudTable from '../components/CrudTable.vue'

const store = useCareerStore()

const activeKey = computed(() => store.activeKey.value)
const profile = computed(() => store.profile.value as any)

const strengthsTags = computed<string[]>({
  get: () => (Array.isArray(store.strengthsTagModel.value) ? (store.strengthsTagModel.value as any[]) : []).map((x) => String(x)),
  set: (v: any) => {
    store.strengthsTagModel.value = Array.isArray(v) ? v : v == null ? [] : [v]
  }
})

const strengthsNewTag = ref('')

function addStrengthTag(raw?: string) {
  const t = String(raw ?? strengthsNewTag.value ?? '').trim()
  if (!t) return
  strengthsTags.value = Array.from(new Set([t, ...strengthsTags.value]))
  strengthsNewTag.value = ''
}

function removeStrengthTag(tag: string) {
  const t = String(tag ?? '').trim()
  strengthsTags.value = strengthsTags.value.filter((x) => x !== t)
}

function toggleStrengthTag(tag: string) {
  const t = String(tag ?? '').trim()
  if (!t) return
  if (strengthsTags.value.includes(t)) removeStrengthTag(t)
  else addStrengthTag(t)
}

const weaknessesTags = computed<string[]>({
  get: () => (Array.isArray(store.weaknessesTagModel.value) ? (store.weaknessesTagModel.value as any[]) : []).map((x) => String(x)),
  set: (v: any) => {
    store.weaknessesTagModel.value = Array.isArray(v) ? v : v == null ? [] : [v]
  }
})

const weaknessesNewTag = ref('')

function addWeaknessTag(raw?: string) {
  const t = String(raw ?? weaknessesNewTag.value ?? '').trim()
  if (!t) return
  weaknessesTags.value = Array.from(new Set([t, ...weaknessesTags.value]))
  weaknessesNewTag.value = ''
}

function removeWeaknessTag(tag: string) {
  const t = String(tag ?? '').trim()
  weaknessesTags.value = weaknessesTags.value.filter((x) => x !== t)
}

function toggleWeaknessTag(tag: string) {
  const t = String(tag ?? '').trim()
  if (!t) return
  if (weaknessesTags.value.includes(t)) removeWeaknessTag(t)
  else addWeaknessTag(t)
}

const personalityTags = computed<string[]>({
  get: () => (Array.isArray(store.personalityTagModel.value) ? (store.personalityTagModel.value as any[]) : []).map((x) => String(x)),
  set: (v: any) => {
    store.personalityTagModel.value = Array.isArray(v) ? v : v == null ? [] : [v]
  }
})

const personalityNewTag = ref('')

function addPersonalityTag(raw?: string) {
  const t = String(raw ?? personalityNewTag.value ?? '').trim()
  if (!t) return
  personalityTags.value = Array.from(new Set([t, ...personalityTags.value]))
  personalityNewTag.value = ''
}

function removePersonalityTag(tag: string) {
  const t = String(tag ?? '').trim()
  personalityTags.value = personalityTags.value.filter((x) => x !== t)
}

function togglePersonalityTag(tag: string) {
  const t = String(tag ?? '').trim()
  if (!t) return
  if (personalityTags.value.includes(t)) removePersonalityTag(t)
  else addPersonalityTag(t)
}
const childrenColumns = [
  { title: '出生年月', key: 'birthMonth' },
  { title: '操作', key: 'actions' }
]
const parentsColumns = [
  { title: '成员', dataIndex: 'label', key: 'label' },
  { title: '出生年月', key: 'birthMonth' },
  { title: '状态', key: 'lifeStatus' },
  { title: '有退休金', key: 'pension' }
]

const childrenRows = computed(() => {
  const arr = Array.isArray(store.profile.value?.family?.childrenBirthMonths) ? store.profile.value.family.childrenBirthMonths : []
  return arr.map((birthMonth: any, idx: number) => ({ key: idx, birthMonth: String(birthMonth ?? '').trim() }))
})

function ensureFamily() {
  if (!store.profile.value.family) {
    store.profile.value.family = {
      childrenBirthMonths: [],
      parents: { fatherBirthMonth: '', motherBirthMonth: '', fatherHasPension: null, motherHasPension: null, fatherLifeStatus: 'unknown', motherLifeStatus: 'unknown' },
      socialSecurityYears: null
    }
  }
  if (!store.profile.value.family.parents)
    store.profile.value.family.parents = { fatherBirthMonth: '', motherBirthMonth: '', fatherHasPension: null, motherHasPension: null, fatherLifeStatus: 'unknown', motherLifeStatus: 'unknown' }
  if (!Array.isArray(store.profile.value.family.childrenBirthMonths)) store.profile.value.family.childrenBirthMonths = []
  if (!Object.prototype.hasOwnProperty.call(store.profile.value.family, 'socialSecurityYears')) store.profile.value.family.socialSecurityYears = null
}

function addChild() {
  ensureFamily()
  store.profile.value.family.childrenBirthMonths = [...store.profile.value.family.childrenBirthMonths, '']
}

function removeChild(index: number) {
  ensureFamily()
  store.profile.value.family.childrenBirthMonths = store.profile.value.family.childrenBirthMonths.filter((_: any, i: number) => i !== index)
}

function updateChildBirthMonth(index: number, v: string) {
  ensureFamily()
  const next = [...store.profile.value.family.childrenBirthMonths]
  next[index] = String(v ?? '').trim()
  store.profile.value.family.childrenBirthMonths = next
}

const parentsRows = computed(() => {
  const p = store.profile.value?.family?.parents ?? {}
  return [
    { key: 'father', label: '父亲', birthMonth: p.fatherBirthMonth ?? '', lifeStatus: p.fatherLifeStatus ?? 'unknown', hasPension: p.fatherHasPension ?? 'unknown' },
    { key: 'mother', label: '母亲', birthMonth: p.motherBirthMonth ?? '', lifeStatus: p.motherLifeStatus ?? 'unknown', hasPension: p.motherHasPension ?? 'unknown' }
  ]
})

function updateParentBirthMonth(which: 'father' | 'mother', v: string) {
  ensureFamily()
  const val = String(v ?? '').trim()
  if (which === 'father') store.profile.value.family.parents.fatherBirthMonth = val
  if (which === 'mother') store.profile.value.family.parents.motherBirthMonth = val
}

function updateParentPension(which: 'father' | 'mother', v: string) {
  ensureFamily()
  const val = String(v ?? 'unknown')
  if (which === 'father') store.profile.value.family.parents.fatherHasPension = val
  if (which === 'mother') store.profile.value.family.parents.motherHasPension = val
}

function updateParentLifeStatus(which: 'father' | 'mother', v: string) {
  ensureFamily()
  const val = String(v ?? 'unknown')
  if (which === 'father') store.profile.value.family.parents.fatherLifeStatus = val
  if (which === 'mother') store.profile.value.family.parents.motherLifeStatus = val
}
const hashtagData = computed(() => store.hashtagData.value as any)
const hashtagFlatOptions = computed(() => store.hashtagFlatOptions.value as any[])
const educationItems = computed(() => store.educationItems.value)
const experienceItems = computed(() => store.experienceItems.value)
const artifactsItems = computed(() => store.artifactsItems.value)
const projectsItems = computed(() => store.projectsItems.value)
const awardsItems = computed(() => store.awardsItems.value)
const honorsItems = computed(() => store.honorsItems.value)
const achievementsItems = computed(() => store.achievementsItems.value)
const certificatesItems = computed(() => store.certificatesItems.value)
const speechItems = computed(() => store.speechItems.value)
const communityItems = computed(() => store.communityItems.value)
const socialItems = computed(() => store.socialItems.value)
const jobIntentItems = computed(() => store.jobIntentItems.value)
const skillsItems = computed(() => store.skillsItems.value)
const languagesItems = computed(() => store.languagesItems.value)
const strengthsItems = computed(() => store.strengthsItems.value)
const weaknessesItems = computed(() => store.weaknessesItems.value)
const personalityItems = computed(() => store.personalityItems.value)

const skillsQuickSelectedModel = computed({
  get: () => store.skillsQuickSelected.value,
  set: (v: any) => {
    store.skillsQuickSelected.value = Array.isArray(v) ? v : v == null ? [] : [v]
  }
})

const skillsQuickLevelModel = computed({
  get: () => store.skillsQuickLevel.value,
  set: (v: any) => {
    store.skillsQuickLevel.value = String(v ?? 'intermediate') || 'intermediate'
  }
})
</script>
