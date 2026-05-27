<template>
  <a-config-provider>
    <a-layout style="min-height: 100vh">
      <SideMenu />
      <a-layout>
        <a-layout-content style="padding: 16px">
          <a-space direction="vertical" style="width: 100%" size="middle">
            <AppHeaderBar />

            <a-card>
              <ResumePage v-if="isResumePage" />
              <ConstraintsPage v-else-if="activeKey === 'constraints'" />
              <GoalsPage v-else-if="activeKey === 'goals'" />
              <GoalCandidatesPage v-else-if="activeKey === 'goalCandidates'" />
              <VerificationPage v-else-if="activeKey === 'verification'" />
              <AnalysisPage v-else-if="activeKey === 'analysis'" />
              <PlanPage v-else-if="activeKey === 'plan'" />
            </a-card>

            <EditorDrawer />
          </a-space>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppHeaderBar from './components/AppHeaderBar.vue'
import EditorDrawer from './components/EditorDrawer.vue'
import SideMenu from './components/SideMenu.vue'
import AnalysisPage from './pages/AnalysisPage.vue'
import ConstraintsPage from './pages/ConstraintsPage.vue'
import GoalCandidatesPage from './pages/GoalCandidatesPage.vue'
import GoalsPage from './pages/GoalsPage.vue'
import PlanPage from './pages/PlanPage.vue'
import ResumePage from './pages/ResumePage.vue'
import VerificationPage from './pages/VerificationPage.vue'
import { useCareerStore } from './store/careerStore'

const store = useCareerStore()

onMounted(() => {
  store.init().catch(() => {})
})

const activeKey = computed(() => store.activeKey.value)

const isResumePage = computed(() =>
  [
    'profile',
    'hashtags',
    'skills',
    'tools',
    'languages',
    'strengths',
    'personality',
    'education',
    'experience',
    'projects',
    'moments',
    'artifacts',
    'awards',
    'honors',
    'achievements',
    'certificates',
    'speech',
    'community',
    'social',
    'jobIntent'
  ].includes(activeKey.value)
)
</script>
