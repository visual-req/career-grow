<template>
  <a-space style="width: 100%; justify-content: space-between" wrap>
    <a-space wrap>
      <a-select
        v-model:value="historySelectedId"
        :options="historyOptions"
        style="min-width: 320px"
        allow-clear
        show-search
        placeholder="历史分析结果"
        :loading="analyzeHistoryLoading"
      />
      <a-button :loading="analyzeHistoryLoading" @click="store.loadAnalyzeHistory">刷新历史</a-button>
      <a-button :disabled="!historySelectedId" @click="store.showAnalyzeFromHistory(historySelectedId)">加载</a-button>
    </a-space>
    <a-button type="primary" :loading="analyzeLoading" @click="store.runAnalyze">分析</a-button>
  </a-space>

  <a-alert style="margin-top: 12px" type="info" message="内容由 AI 生成，请自行甄别。" show-icon />

  <a-alert v-if="analyzeHistoryError" style="margin-top: 12px" type="warning" :message="`历史加载失败：${analyzeHistoryError}`" show-icon />

  <a-alert v-if="analyzeError" style="margin-top: 12px" type="error" :message="analyzeError" show-icon />

  <template v-if="analyzeResult">
    <a-space direction="vertical" style="width: 100%; margin-top: 12px" size="middle">
      <a-space direction="vertical" style="width: 100%" size="small" v-if="analyzeResult.blocked">
        <a-alert type="warning" :message="analyzeResult.blocked?.reason ?? '信息不完整'" show-icon />
          <a-list
            v-if="(analyzeResult.blocked?.details ?? []).length"
            size="small"
            bordered
            :dataSource="analyzeResult.blocked?.details ?? []"
          >
            <template #header>问题定位</template>
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        <a-space wrap v-if="missingItems.length">
          <a-button v-for="m in missingItems" :key="m" type="link" @click="goFillInfo(m)">去填写：{{ m }}</a-button>
        </a-space>
        <a-button v-else type="link" @click="goFillInfo()">去补齐信息</a-button>
      </a-space>
      <a-collapse>
        <a-collapse-panel key="goal" header="目标 Panel" v-if="analyzeResult.goalPanel">
          <a-space direction="vertical" style="width: 100%" size="small">
            <a-typography-title :level="5">SMART 原则</a-typography-title>
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="得分">{{ analyzeResult.goalPanel?.smart?.score ?? '-' }}/5</a-descriptions-item>
            </a-descriptions>
            <a-table
              :columns="store.smartColumns"
              :dataSource="analyzeResult.goalPanel?.smart?.checks ?? []"
              :pagination="false"
              rowKey="key"
              size="small"
              style="margin-top: 8px"
            />

            <a-typography-title :level="5" style="margin-top: 12px">可行性</a-typography-title>
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="状态">{{ analyzeResult.goalPanel?.feasibility?.status ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="评分">{{ analyzeResult.goalPanel?.feasibility?.score ?? '-' }}</a-descriptions-item>
            </a-descriptions>
            <a-list
              v-if="(analyzeResult.goalPanel?.feasibility?.reasons ?? []).length"
              size="small"
              bordered
              :dataSource="analyzeResult.goalPanel?.feasibility?.reasons ?? []"
              style="margin-top: 8px"
            >
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>

            <a-typography-title :level="5" style="margin-top: 12px">意义与价值</a-typography-title>
            <a-typography-paragraph type="secondary">{{ analyzeResult.goalPanel?.value?.summary ?? '-' }}</a-typography-paragraph>
            <a-table
              v-if="(analyzeResult.goalPanel?.value?.factors ?? []).length"
              :columns="valueColumns"
              :dataSource="analyzeResult.goalPanel?.value?.factors ?? []"
              :pagination="false"
              rowKey="key"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'notes'">
                  <a-list size="small" :split="false" :dataSource="record.notes ?? []">
                    <template #renderItem="{ item }">
                      <a-list-item style="padding: 0">{{ item }}</a-list-item>
                    </template>
                  </a-list>
                </template>
              </template>
            </a-table>
            <a-list
              v-if="(analyzeResult.goalPanel?.value?.questionsToVerify ?? []).length"
              size="small"
              bordered
              :dataSource="analyzeResult.goalPanel?.value?.questionsToVerify ?? []"
              style="margin-top: 8px"
            >
              <template #header>需要验证的问题</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
            <a-space style="margin-top: 8px">
              <a-button type="primary" ghost @click="store.setActiveKey('verification')">去填写/更新：验证信息</a-button>
            </a-space>
          </a-space>
        </a-collapse-panel>

        <a-collapse-panel key="finance" header="财务分析" v-if="analyzeResult.financialPanel || analyzeResult.salaryGapPanel">
          <a-space direction="vertical" style="width: 100%" size="small">
            <a-space style="width: 100%; justify-content: flex-end">
              <a-button type="primary" ghost @click="store.setActiveKey('verification')">去填写/更新：验证信息</a-button>
            </a-space>

            <a-card size="small" title="目标地区薪资与税后到手" v-if="analyzeResult.financialPanel">
              <a-descriptions bordered size="small" :column="1">
                <a-descriptions-item label="目标城市">{{ analyzeResult.financialPanel?.city || '-' }}</a-descriptions-item>
                <a-descriptions-item label="目标岗位">{{ analyzeResult.financialPanel?.role || '-' }}</a-descriptions-item>
                <a-descriptions-item label="税前主流区间（k/月）">
                  {{
                    analyzeResult.financialPanel?.salary?.grossMinK != null && analyzeResult.financialPanel?.salary?.grossMaxK != null
                      ? `${analyzeResult.financialPanel.salary.grossMinK}-${analyzeResult.financialPanel.salary.grossMaxK}`
                      : '-'
                  }}
                </a-descriptions-item>
                <a-descriptions-item label="税后到手区间（k/月）">
                  {{
                    analyzeResult.financialPanel?.salary?.netMinK != null && analyzeResult.financialPanel?.salary?.netMaxK != null
                      ? `${analyzeResult.financialPanel.salary.netMinK}-${analyzeResult.financialPanel.salary.netMaxK}${analyzeResult.financialPanel.salary.netEstimated ? '（估算）' : ''}`
                      : '-'
                  }}
                </a-descriptions-item>
                <a-descriptions-item label="奖金月数">
                  {{ analyzeResult.financialPanel?.salary?.bonusMonths != null ? analyzeResult.financialPanel.salary.bonusMonths : '-' }}
                </a-descriptions-item>
              </a-descriptions>
              <a-list
                v-if="(analyzeResult.financialPanel?.salary?.sources ?? []).length"
                size="small"
                bordered
                :dataSource="analyzeResult.financialPanel?.salary?.sources ?? []"
                style="margin-top: 8px"
              >
                <template #header>信息来源</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-typography-paragraph v-if="analyzeResult.financialPanel?.salary?.notes" type="secondary" style="margin-top: 8px">
                {{ analyzeResult.financialPanel?.salary?.notes }}
              </a-typography-paragraph>
            </a-card>

            <a-card size="small" title="生活成本与可支配净收入" v-if="analyzeResult.financialPanel">
              <a-descriptions bordered size="small" :column="1">
                <a-descriptions-item label="生活成本合计（k/月）">
                  {{ analyzeResult.financialPanel?.cost?.totalK != null ? analyzeResult.financialPanel.cost.totalK : '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="扣除成本后可支配净收入（k/月）">
                  {{
                    analyzeResult.financialPanel?.netAfterCost?.minK != null && analyzeResult.financialPanel?.netAfterCost?.maxK != null
                      ? `${analyzeResult.financialPanel.netAfterCost.minK}-${analyzeResult.financialPanel.netAfterCost.maxK}`
                      : '-'
                  }}
                </a-descriptions-item>
              </a-descriptions>
              <a-list
                v-if="(analyzeResult.financialPanel?.cost?.items ?? []).length"
                size="small"
                bordered
                :dataSource="analyzeResult.financialPanel?.cost?.items ?? []"
                style="margin-top: 8px"
              >
                <template #header>成本拆分</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item.label }}：{{ item.k }}k/月</a-list-item>
                </template>
              </a-list>
              <a-typography-paragraph v-if="analyzeResult.financialPanel?.cost?.notes" type="secondary" style="margin-top: 8px">
                {{ analyzeResult.financialPanel?.cost?.notes }}
              </a-typography-paragraph>
              <a-typography-paragraph v-if="analyzeResult.financialPanel?.taxNotes" type="secondary" style="margin-top: 8px">
                {{ analyzeResult.financialPanel?.taxNotes }}
              </a-typography-paragraph>
              <a-list
                v-if="(analyzeResult.financialPanel?.issues ?? []).length"
                size="small"
                bordered
                :dataSource="analyzeResult.financialPanel?.issues ?? []"
                style="margin-top: 8px"
              >
                <template #header>待补齐</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list
                v-if="(analyzeResult.financialPanel?.recommendations ?? []).length"
                size="small"
                bordered
                :dataSource="analyzeResult.financialPanel?.recommendations ?? []"
                style="margin-top: 8px"
              >
                <template #header>建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="当前薪资 vs 目标薪资（粗略估算）" v-if="analyzeResult.salaryGapPanel">
              <a-typography-paragraph type="secondary">{{ analyzeResult.salaryGapPanel?.assessment ?? '' }}</a-typography-paragraph>
              <a-list
                v-if="(analyzeResult.salaryGapPanel?.recommendations ?? []).length"
                size="small"
                bordered
                :dataSource="analyzeResult.salaryGapPanel?.recommendations ?? []"
              >
                <template #header>建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>
          </a-space>
        </a-collapse-panel>

        <a-collapse-panel
          key="artifacts"
          header="作品分析"
          v-if="(analyzeResult.artifactsPanel?.insights ?? []).length || (analyzeResult.artifactsPanel?.recommendedAdditions ?? []).length"
        >
          <a-collapse v-if="(analyzeResult.artifactsPanel?.insights ?? []).length">
            <a-collapse-panel v-for="x in analyzeResult.artifactsPanel?.insights ?? []" :key="x.id || x.name" :header="`${x.category}：${x.name || '未命名'}`">
              <a-list size="small" bordered :dataSource="x.summary ?? []" v-if="(x.summary ?? []).length">
                <template #header>要点</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="x.risks ?? []" v-if="(x.risks ?? []).length" style="margin-top: 8px">
                <template #header>风险/注意</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-collapse-panel>
          </a-collapse>
          <a-list
            v-if="(analyzeResult.artifactsPanel?.recommendedAdditions ?? []).length"
            size="small"
            bordered
            :dataSource="analyzeResult.artifactsPanel?.recommendedAdditions ?? []"
            style="margin-top: 8px"
          >
            <template #header>建议新增的作品/证明材料</template>
            <template #renderItem="{ item }">
              <a-list-item>{{ item }}</a-list-item>
            </template>
          </a-list>
        </a-collapse-panel>

        <a-collapse-panel key="personal" header="个人信息 Panel">
          <a-space direction="vertical" style="width: 100%" size="small">
            <a-typography-title :level="5">完整性</a-typography-title>
            <a-list size="small" bordered :dataSource="missingItems" v-if="missingItems.length">
              <template #header>缺失字段</template>
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-space>
                    <span>{{ item }}</span>
                    <a-button type="link" size="small" @click="goFillInfo(item)">去填写</a-button>
                  </a-space>
                </a-list-item>
              </template>
            </a-list>
            <a-list
              size="small"
              bordered
              :dataSource="analyzeResult.personalPanel?.completeness?.hints ?? []"
              v-if="(analyzeResult.personalPanel?.completeness?.hints ?? []).length"
              style="margin-top: 8px"
            >
              <template #header>建议</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>

            <a-typography-title :level="5" style="margin-top: 12px">一致性</a-typography-title>
            <a-list size="small" bordered :dataSource="analyzeResult.personalPanel?.consistency?.issues ?? []" v-if="(analyzeResult.personalPanel?.consistency?.issues ?? []).length">
              <template #header>问题</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
            <a-empty v-else description="暂无一致性问题" />

            <a-typography-title :level="5" style="margin-top: 12px">Ladder Jumper</a-typography-title>
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="判断">{{ analyzeResult.personalPanel?.ladderJumper?.status ?? '-' }}</a-descriptions-item>
              <a-descriptions-item label="评分">{{ analyzeResult.personalPanel?.ladderJumper?.score ?? '-' }}</a-descriptions-item>
            </a-descriptions>
            <a-list
              size="small"
              bordered
              :dataSource="analyzeResult.personalPanel?.ladderJumper?.reasons ?? []"
              v-if="(analyzeResult.personalPanel?.ladderJumper?.reasons ?? []).length"
              style="margin-top: 8px"
            >
              <template #header>依据</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
          </a-space>
        </a-collapse-panel>

        <a-collapse-panel key="gap" header="差距分析" v-if="analyzeResult.gapAnalysis">
          <a-collapse>
            <a-collapse-panel v-for="d in analyzeResult.gapAnalysis?.domains ?? []" :key="d.domain" :header="`${d.domain}（${toZhStatus(d.status)}）`">
              <a-typography-paragraph type="secondary">{{ d.summary }}</a-typography-paragraph>
              <a-list v-if="(d.items ?? []).length" size="small" bordered :dataSource="d.items ?? []">
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-empty v-else description="该领域暂无建议" />
            </a-collapse-panel>
          </a-collapse>
        </a-collapse-panel>

        <a-collapse-panel key="capability" header="能力映射表" v-if="analyzeResult.capabilityMap">
          <a-space direction="vertical" style="width: 100%" size="middle">
            <a-typography-paragraph type="secondary">
              目标岗位：{{ analyzeResult.capabilityMap?.targetRole || '-' }}
            </a-typography-paragraph>
            <div ref="capabilityChartEl" style="height: 360px; width: 100%" />
            <a-table
              size="small"
              :pagination="false"
              :dataSource="analyzeResult.capabilityMap?.items ?? []"
              rowKey="key"
              :columns="capabilityColumns"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'evidence'">
                  <a-list size="small" :split="false" :dataSource="record.evidence ?? []">
                    <template #renderItem="{ item }">
                      <a-list-item style="padding: 0">{{ item }}</a-list-item>
                    </template>
                  </a-list>
                </template>
                <template v-else-if="column.key === 'recommendations'">
                  <a-list size="small" :split="false" :dataSource="record.recommendations ?? []">
                    <template #renderItem="{ item }">
                      <a-list-item style="padding: 0">{{ item }}</a-list-item>
                    </template>
                  </a-list>
                </template>
              </template>
            </a-table>
          </a-space>
        </a-collapse-panel>

        <a-collapse-panel
          key="advice"
          header="建议"
          v-if="
            analyzeResult.resumePreparationAdvice ||
            analyzeResult.workDevelopmentAdvice ||
            analyzeResult.certificationAdvice ||
            analyzeResult.softSkillsPanel ||
            analyzeResult.professionalSkillsAdvice ||
            analyzeResult.languageAbilityAdvice ||
            analyzeResult.outputPublishingAdvice ||
            analyzeResult.influenceAdvice ||
            analyzeResult.interviewAdvice ||
            analyzeResult.marketStrategy ||
            analyzeResult.riskAndConstraints
          "
        >
          <a-space direction="vertical" style="width: 100%" size="middle">
            <a-card size="small" title="简历准备建议" v-if="analyzeResult.resumePreparationAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.resumePreparationAdvice?.checklist ?? []" v-if="(analyzeResult.resumePreparationAdvice?.checklist ?? []).length">
                <template #header>清单</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.resumePreparationAdvice?.rewriteSuggestions ?? []" v-if="(analyzeResult.resumePreparationAdvice?.rewriteSuggestions ?? []).length" style="margin-top: 8px">
                <template #header>改写建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.resumePreparationAdvice?.projectCaseSuggestions ?? []" v-if="(analyzeResult.resumePreparationAdvice?.projectCaseSuggestions ?? []).length" style="margin-top: 8px">
                <template #header>项目案例建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="个人发展建议（含不跳槽场景）" v-if="analyzeResult.workDevelopmentAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.workDevelopmentAdvice?.recommendedProjectTypes ?? []" v-if="(analyzeResult.workDevelopmentAdvice?.recommendedProjectTypes ?? []).length">
                <template #header>建议参与的项目类型</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.workDevelopmentAdvice?.recommendedRoles ?? []" v-if="(analyzeResult.workDevelopmentAdvice?.recommendedRoles ?? []).length" style="margin-top: 8px">
                <template #header>建议承担的身份/角色</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.workDevelopmentAdvice?.projectExperienceUpgrade ?? []" v-if="(analyzeResult.workDevelopmentAdvice?.projectExperienceUpgrade ?? []).length" style="margin-top: 8px">
                <template #header>项目经历升级动作</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.workDevelopmentAdvice?.skillAccumulationPlan ?? []" v-if="(analyzeResult.workDevelopmentAdvice?.skillAccumulationPlan ?? []).length" style="margin-top: 8px">
                <template #header>技能积累计划</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="考证书建议" v-if="analyzeResult.certificationAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.certificationAdvice?.recommended ?? []" v-if="(analyzeResult.certificationAdvice?.recommended ?? []).length">
                <template #header>推荐</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.certificationAdvice?.notRecommended ?? []" v-if="(analyzeResult.certificationAdvice?.notRecommended ?? []).length" style="margin-top: 8px">
                <template #header>不推荐</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.certificationAdvice?.rationale ?? []" v-if="(analyzeResult.certificationAdvice?.rationale ?? []).length" style="margin-top: 8px">
                <template #header>理由</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.certificationAdvice?.studyPlan ?? []" v-if="(analyzeResult.certificationAdvice?.studyPlan ?? []).length" style="margin-top: 8px">
                <template #header>学习路径</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="软技能分析与建议" v-if="analyzeResult.softSkillsPanel">
              <a-typography-paragraph type="secondary">{{ analyzeResult.softSkillsPanel?.summary ?? '' }}</a-typography-paragraph>
              <a-list size="small" bordered :dataSource="analyzeResult.softSkillsPanel?.strengths ?? []" v-if="(analyzeResult.softSkillsPanel?.strengths ?? []).length">
                <template #header>已体现的软技能</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.softSkillsPanel?.gaps ?? []" v-if="(analyzeResult.softSkillsPanel?.gaps ?? []).length" style="margin-top: 8px">
                <template #header>缺口</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.softSkillsPanel?.recommendations ?? []" v-if="(analyzeResult.softSkillsPanel?.recommendations ?? []).length" style="margin-top: 8px">
                <template #header>建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.softSkillsPanel?.weeklyActions ?? []" v-if="(analyzeResult.softSkillsPanel?.weeklyActions ?? []).length" style="margin-top: 8px">
                <template #header>每周动作</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="专业技能提升建议" v-if="analyzeResult.professionalSkillsAdvice">
              <a-typography-paragraph type="secondary">{{ analyzeResult.professionalSkillsAdvice?.summary ?? '' }}</a-typography-paragraph>
              <a-list size="small" bordered :dataSource="analyzeResult.professionalSkillsAdvice?.focusAreas ?? []" v-if="(analyzeResult.professionalSkillsAdvice?.focusAreas ?? []).length">
                <template #header>优先补齐的方向</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.professionalSkillsAdvice?.gaps ?? []" v-if="(analyzeResult.professionalSkillsAdvice?.gaps ?? []).length" style="margin-top: 8px">
                <template #header>缺口</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.professionalSkillsAdvice?.recommendations ?? []" v-if="(analyzeResult.professionalSkillsAdvice?.recommendations ?? []).length" style="margin-top: 8px">
                <template #header>建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.professionalSkillsAdvice?.projectPractice ?? []" v-if="(analyzeResult.professionalSkillsAdvice?.projectPractice ?? []).length" style="margin-top: 8px">
                <template #header>项目化练习</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.professionalSkillsAdvice?.weeklyPlan ?? []" v-if="(analyzeResult.professionalSkillsAdvice?.weeklyPlan ?? []).length" style="margin-top: 8px">
                <template #header>每周计划</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="语言能力提升建议" v-if="analyzeResult.languageAbilityAdvice">
              <a-typography-paragraph type="secondary">{{ analyzeResult.languageAbilityAdvice?.summary ?? '' }}</a-typography-paragraph>
              <a-list size="small" bordered :dataSource="analyzeResult.languageAbilityAdvice?.gaps ?? []" v-if="(analyzeResult.languageAbilityAdvice?.gaps ?? []).length">
                <template #header>缺口</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.languageAbilityAdvice?.recommendations ?? []" v-if="(analyzeResult.languageAbilityAdvice?.recommendations ?? []).length" style="margin-top: 8px">
                <template #header>建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.languageAbilityAdvice?.weeklyPlan ?? []" v-if="(analyzeResult.languageAbilityAdvice?.weeklyPlan ?? []).length" style="margin-top: 8px">
                <template #header>每周计划</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.languageAbilityAdvice?.proofSuggestions ?? []" v-if="(analyzeResult.languageAbilityAdvice?.proofSuggestions ?? []).length" style="margin-top: 8px">
                <template #header>证据建议</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="成果发布建议" v-if="analyzeResult.outputPublishingAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.outputPublishingAdvice?.whatToPublish ?? []" v-if="(analyzeResult.outputPublishingAdvice?.whatToPublish ?? []).length">
                <template #header>发布什么</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.outputPublishingAdvice?.whereToPublish ?? []" v-if="(analyzeResult.outputPublishingAdvice?.whereToPublish ?? []).length" style="margin-top: 8px">
                <template #header>发布到哪里</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.outputPublishingAdvice?.cadence ?? []" v-if="(analyzeResult.outputPublishingAdvice?.cadence ?? []).length" style="margin-top: 8px">
                <template #header>频率节奏</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.outputPublishingAdvice?.repurposePlan ?? []" v-if="(analyzeResult.outputPublishingAdvice?.repurposePlan ?? []).length" style="margin-top: 8px">
                <template #header>一稿多投</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="影响力提升建议" v-if="analyzeResult.influenceAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.influenceAdvice?.channels ?? []" v-if="(analyzeResult.influenceAdvice?.channels ?? []).length">
                <template #header>渠道策略</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.influenceAdvice?.weeklyActions ?? []" v-if="(analyzeResult.influenceAdvice?.weeklyActions ?? []).length" style="margin-top: 8px">
                <template #header>每周动作</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.influenceAdvice?.portfolioPackaging ?? []" v-if="(analyzeResult.influenceAdvice?.portfolioPackaging ?? []).length" style="margin-top: 8px">
                <template #header>作品集包装</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="面试要领建议" v-if="analyzeResult.interviewAdvice">
              <a-list size="small" bordered :dataSource="analyzeResult.interviewAdvice?.mustPrepareTopics ?? []" v-if="(analyzeResult.interviewAdvice?.mustPrepareTopics ?? []).length">
                <template #header>必须准备</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.interviewAdvice?.behavioral ?? []" v-if="(analyzeResult.interviewAdvice?.behavioral ?? []).length" style="margin-top: 8px">
                <template #header>行为面试</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.interviewAdvice?.technical ?? []" v-if="(analyzeResult.interviewAdvice?.technical ?? []).length" style="margin-top: 8px">
                <template #header>技术/专业</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.interviewAdvice?.mockPlan ?? []" v-if="(analyzeResult.interviewAdvice?.mockPlan ?? []).length" style="margin-top: 8px">
                <template #header>模拟计划</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="投递/策略建议" v-if="analyzeResult.marketStrategy">
              <a-list size="small" bordered :dataSource="analyzeResult.marketStrategy?.searchStrategy ?? []" v-if="(analyzeResult.marketStrategy?.searchStrategy ?? []).length">
                <template #header>检索策略</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.marketStrategy?.referralStrategy ?? []" v-if="(analyzeResult.marketStrategy?.referralStrategy ?? []).length" style="margin-top: 8px">
                <template #header>内推策略</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.marketStrategy?.portfolioStrategy ?? []" v-if="(analyzeResult.marketStrategy?.portfolioStrategy ?? []).length" style="margin-top: 8px">
                <template #header>作品集策略</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.marketStrategy?.applicationRhythm ?? []" v-if="(analyzeResult.marketStrategy?.applicationRhythm ?? []).length" style="margin-top: 8px">
                <template #header>投递节奏</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list
                size="small"
                bordered
                :dataSource="analyzeResult.marketStrategy?.industryFocus?.notes ?? []"
                v-if="(analyzeResult.marketStrategy?.industryFocus?.notes ?? []).length"
                style="margin-top: 8px"
              >
                <template #header>
                  行业深耕 vs 跨行业（{{ analyzeResult.marketStrategy?.industryFocus?.status ?? '-' }}）
                </template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-card size="small" title="约束与风险" v-if="analyzeResult.riskAndConstraints">
              <a-list size="small" bordered :dataSource="analyzeResult.riskAndConstraints?.constraints ?? []" v-if="(analyzeResult.riskAndConstraints?.constraints ?? []).length">
                <template #header>约束</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.riskAndConstraints?.risks ?? []" v-if="(analyzeResult.riskAndConstraints?.risks ?? []).length" style="margin-top: 8px">
                <template #header>风险</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
              <a-list size="small" bordered :dataSource="analyzeResult.riskAndConstraints?.mitigations ?? []" v-if="(analyzeResult.riskAndConstraints?.mitigations ?? []).length" style="margin-top: 8px">
                <template #header>应对</template>
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </a-card>

            <a-typography-title :level="5" style="margin-top: 12px">综合结论</a-typography-title>
            <a-typography-paragraph type="secondary">{{ analyzeResult.personalPanel?.summary?.conclusion ?? '-' }}</a-typography-paragraph>
            <a-list
              v-if="(analyzeResult.personalPanel?.summary?.growth ?? []).length"
              size="small"
              bordered
              :dataSource="analyzeResult.personalPanel?.summary?.growth ?? []"
            >
              <template #header>能力成长</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
            <a-list
              v-if="(analyzeResult.personalPanel?.summary?.projectExperience ?? []).length"
              size="small"
              bordered
              :dataSource="analyzeResult.personalPanel?.summary?.projectExperience ?? []"
              style="margin-top: 8px"
            >
              <template #header>项目经验</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
            <a-list
              v-if="analyzeResult.personalPanel?.summary?.personalitySummary"
              size="small"
              bordered
              :dataSource="[analyzeResult.personalPanel?.summary?.personalitySummary]"
              style="margin-top: 8px"
            >
              <template #header>性格特征</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
            <a-list
              v-if="analyzeResult.personalPanel?.summary?.toolkitSummary"
              size="small"
              bordered
              :dataSource="[analyzeResult.personalPanel?.summary?.toolkitSummary]"
              style="margin-top: 8px"
            >
              <template #header>工具/方法</template>
              <template #renderItem="{ item }">
                <a-list-item>{{ item }}</a-list-item>
              </template>
            </a-list>
          </a-space>
        </a-collapse-panel>
      </a-collapse>

    </a-space>
  </template>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCareerStore } from '../store/careerStore'

const store = useCareerStore()

const analyzeLoading = computed(() => store.analyzeLoading.value)
const analyzeError = computed(() => store.analyzeError.value)
const analyzeResult = computed(() => store.analyzeResult.value)
const analyzeHistoryLoading = computed(() => store.analyzeHistoryLoading.value)
const analyzeHistoryError = computed(() => store.analyzeHistoryError.value)
const analyzeHistory = computed(() => store.analyzeHistory.value)

const historySelectedId = ref<string>('')

function formatHistoryLabel(x: any) {
  const at = String(x?.generatedAt ?? x?.generatedAtUtc ?? '').trim()
  const role = String(x?.targetRole ?? '').trim()
  const d = at ? at.replace('T', ' ').replace('Z', '').slice(0, 16) : ''
  const r = role || '未命名目标'
  return d ? `${d} · ${r}` : r
}

const historyOptions = computed(() =>
  (Array.isArray(analyzeHistory.value) ? analyzeHistory.value : [])
    .map((x: any) => ({
      value: String(x?.id ?? '').trim(),
      label: formatHistoryLabel(x)
    }))
    .filter((x: any) => x.value)
)

const capabilityColumns = [
  { title: '维度', dataIndex: 'label', key: 'label' },
  { title: '目标', dataIndex: 'required', key: 'required' },
  { title: '当前', dataIndex: 'current', key: 'current' },
  { title: '差距', dataIndex: 'gap', key: 'gap' },
  { title: '证据', key: 'evidence' },
  { title: '建议', key: 'recommendations' }
]

const capabilityChartEl = ref<HTMLDivElement | null>(null)
let capabilityChart: any = null
let capabilityResizeHandler: (() => void) | null = null

function renderCapabilityChart() {
  const echartsAny = (window as any).echarts
  if (!echartsAny || !capabilityChartEl.value) return
  const cm = analyzeResult.value?.capabilityMap
  if (!cm) return
  const indicators = Array.isArray(cm?.indicators) ? cm.indicators : []
  const required = Array.isArray(cm?.required) ? cm.required : []
  const current = Array.isArray(cm?.current) ? cm.current : []
  if (!indicators.length) return

  if (!capabilityChart) capabilityChart = echartsAny.init(capabilityChartEl.value)
  capabilityChart.setOption(
    {
      tooltip: {},
      legend: { data: ['目标', '当前'] },
      radar: { indicator: indicators },
      series: [
        {
          type: 'radar',
          data: [
            { value: required, name: '目标' },
            { value: current, name: '当前' }
          ]
        }
      ]
    },
    true
  )
}

onMounted(() => {
  capabilityResizeHandler = () => capabilityChart?.resize()
  window.addEventListener('resize', capabilityResizeHandler)
  watch(
    () => analyzeResult.value?.capabilityMap,
    () => {
      if (!analyzeResult.value?.capabilityMap) {
        capabilityChart?.clear()
        return
      }
      renderCapabilityChart()
    },
    { deep: true }
  )
})

onMounted(async () => {
  await store.loadAnalyzeHistory()
  const items = Array.isArray(store.analyzeHistory.value) ? store.analyzeHistory.value : []
  if (!store.analyzeResult.value && items.length > 0) {
    const firstId = String(items[0]?.id ?? '').trim()
    if (firstId) {
      historySelectedId.value = firstId
      store.showAnalyzeFromHistory(firstId)
      return
    }
  }
  if (!store.analyzeResult.value) await store.loadLatestAnalyze()
})

onBeforeUnmount(() => {
  if (capabilityResizeHandler) window.removeEventListener('resize', capabilityResizeHandler)
  capabilityResizeHandler = null
  capabilityChart?.dispose()
  capabilityChart = null
})

function toZhStatus(v: any) {
  const s = String(v ?? '').trim()
  const map: Record<string, string> = {
    ok: '通过',
    gap: '有缺口',
    review: '需评估',
    unknown: '未知',
    likely: '很可能',
    possible: '可能',
    unlikely: '不太可能'
  }
  return map[s] ?? s
}

const missingItems = computed<string[]>(() =>
  Array.isArray(analyzeResult.value?.personalPanel?.completeness?.missing) ? (analyzeResult.value.personalPanel.completeness.missing as any[]) : []
)

function goFillInfo(missing?: string) {
  const m = String(missing ?? '').trim()
  if (m.includes('目标条目')) {
    store.setActiveKey('goals')
    store.openCreate('goalItems')
    return
  }
  if (m.includes('时间窗口') || m.includes('成功标准')) {
    store.setActiveKey('goals')
    return
  }
  if (m.includes('求职意向')) {
    store.setActiveKey('jobIntent')
    return
  }
  store.setActiveKey('profile')
}

const valueColumns = [
  { title: '因素', dataIndex: 'title', key: 'title' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '说明', key: 'notes' }
]
</script>
