<template>
  <el-dialog
    :model-value="modelValue"
    title="成功案例构建基线"
    width="720px"
    class="baseline-dialog"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="baseline-panel">
      <!-- 操作区 -->
      <div class="baseline-toolbar">
        <el-button type="primary" :icon="Download" @click="handleExport">导出基线</el-button>
        <el-button type="primary" plain :icon="Upload" @click="triggerFileSelect">从文件导入</el-button>
        <el-button :icon="DocumentChecked" @click="runCurrentCheck">执行构建检查</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">恢复内置基线</el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          class="baseline-file-input"
          @change="handleFileChange"
        >
      </div>

      <p class="baseline-meta">
        当前基线来源：
        <el-tag :type="store.baselineMeta.value.source === 'builtin' ? 'info' : 'success'" size="small">
          {{ store.baselineMeta.value.source === 'builtin' ? '内置基线' : '文件导入' }}
        </el-tag>
        <span v-if="store.baselineMeta.value.importedAt" class="meta-time">
          导入时间：{{ formatTime(store.baselineMeta.value.importedAt) }}
        </span>
        <span class="meta-time">案例数：{{ store.cases.value.length }}</span>
      </p>

      <!-- 结果提示 -->
      <el-alert
        v-if="actionError"
        :title="actionError"
        type="error"
        :closable="false"
        show-icon
        class="baseline-alert"
      />
      <el-alert
        v-else-if="actionSuccess"
        :title="actionSuccess"
        type="success"
        :closable="false"
        show-icon
        class="baseline-alert"
      />

      <el-alert
        v-if="report"
        :title="reportTitle"
        :type="report.ok ? 'success' : 'error'"
        :closable="false"
        show-icon
        class="baseline-alert"
      />

      <!-- 规范化清单 -->
      <div v-if="report" class="checklist">
        <div class="checklist-summary">
          <span class="summary-item">案例总数：<b>{{ report.summary.total }}</b></span>
          <span class="summary-item">有效：<b class="ok-text">{{ report.summary.valid }}</b></span>
          <span class="summary-item">缺失/错误：<b :class="report.summary.errors ? 'err-text' : 'ok-text'">{{ report.summary.errors }}</b></span>
          <span class="summary-item">警告：<b :class="report.summary.warnings ? 'warn-text' : 'ok-text'">{{ report.summary.warnings }}</b></span>
        </div>

        <!-- 规范化后的案例清单 -->
        <div class="checklist-section-title">规范化案例清单</div>
        <ul class="case-checklist">
          <li v-for="item in report.cases" :key="item.title" class="case-check-item">
            <el-icon class="status-ok"><CircleCheckFilled /></el-icon>
            <span class="case-name">{{ item.title }}</span>
            <el-tag size="small" effect="plain">{{ item.industry }}</el-tag>
            <el-tag size="small" type="info" effect="plain">{{ tagLabel(item.tag) }}</el-tag>
            <span class="result-count">{{ item.results.length }} 项实施效果</span>
          </li>
          <li v-if="report.cases.length === 0" class="empty-list">没有可规范化的案例</li>
        </ul>

        <!-- 问题清单：缺失字段 / 重复案例 / 缺失案例 -->
        <div v-if="report.issues.length" class="checklist-section-title">检查发现</div>
        <ul class="issue-list">
          <li
            v-for="(issue, index) in report.issues"
            :key="index"
            class="issue-item"
            :class="issue.severity === 'error' ? 'is-error' : 'is-warning'"
          >
            <el-icon>
              <CircleCloseFilled v-if="issue.severity === 'error'" />
              <WarningFilled v-else />
            </el-icon>
            <span>{{ issue.message }}</span>
          </li>
        </ul>
      </div>

      <p class="baseline-hint">
        提示：文件为空、字段不完整或格式不兼容时导入会被拒绝，现有案例不会被覆盖。
      </p>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  DocumentChecked,
  Download,
  RefreshLeft,
  Upload,
  WarningFilled
} from '@element-plus/icons-vue'
import { useCaseStore } from '@/composables/useCaseStore.js'
import { KNOWN_TAGS } from '@/data/caseData.js'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const store = useCaseStore()

const fileInputRef = ref(null)
const report = ref(null)
const actionError = ref('')
const actionSuccess = ref('')

const tagOptions = KNOWN_TAGS.filter((tag) => tag !== 'all')
function tagLabel(tag) {
  const labels = {
    ecommerce: '电商物流',
    express: '快递物流',
    retail: '零售配送',
    manufacturing: '制造业'
  }
  return labels[tag] || tag
}

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { hour12: false })
}

const reportTitle = computed(() => {
  if (!report.value) return ''
  const { errors, warnings } = report.value.summary
  if (report.value.ok && warnings === 0) {
    return `构建检查通过：${report.value.summary.valid} 个案例全部规范，无缺失或重复`
  }
  if (report.value.ok) {
    return `检查完成（有警告）：${errors} 个错误，${warnings} 个警告`
  }
  return `检查未通过：${errors} 个缺失/错误，${warnings} 个警告，未覆盖现有案例`
})

function setAction(error, success) {
  actionError.value = error || ''
  actionSuccess.value = success || ''
}

function triggerFileSelect() {
  setAction('', '')
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const result = store.importBaselineText(String(reader.result || ''))
    if (!result.ok) {
      setAction(`${file.name} 导入失败：${result.error}`, '')
      report.value = null
      ElMessage.error('基线导入被拒绝，现有案例未改动')
    } else {
      report.value = result.report
      const { errors, warnings } = result.report.summary
      setAction(
        '',
        `已从 ${file.name} 导入 ${result.report.cases.length} 个规范化案例（${errors} 错误，${warnings} 警告）`
      )
      ElMessage.success('案例基线已更新')
    }
    event.target.value = ''
  }
  reader.onerror = () => {
    setAction(`无法读取文件 ${file.name}，现有案例保持不变`, '')
    event.target.value = ''
  }
  reader.readAsText(file)
}

function runCurrentCheck() {
  report.value = store.currentReport.value
  setAction('', '')
  ElMessage({
    type: report.value.ok ? 'success' : 'error',
    message: report.value.ok ? '构建检查完成' : '构建检查发现问题，请查看清单'
  })
}

function handleExport() {
  const blob = new Blob([store.exportBaselineText()], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `case-baseline-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('基线文件已导出')
}

async function handleReset() {
  try {
    await ElMessageBox.confirm('确定恢复为内置案例基线？当前导入的基线将被移除。', '恢复内置基线', {
      type: 'warning',
      confirmButtonText: '恢复',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  store.resetToBuiltin()
  report.value = store.currentReport.value
  setAction('', '已恢复为内置案例基线')
  ElMessage.success('已恢复内置基线')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.baseline-panel {
  font-size: $font-size-sm;
}

.baseline-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.baseline-file-input {
  display: none;
}

.baseline-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
  color: $text-secondary;
  margin-bottom: $spacing-md;

  .meta-time {
    font-size: $font-size-xs;
  }
}

.baseline-alert {
  margin-bottom: $spacing-md;
}

.baseline-hint {
  margin-top: $spacing-md;
  font-size: $font-size-xs;
  color: $text-placeholder;
}

.checklist {
  border: 1px solid $border-light;
  border-radius: $radius-md;
  padding: $spacing-md;
  max-height: 320px;
  overflow-y: auto;
}

.checklist-summary {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  padding-bottom: $spacing-sm;
  margin-bottom: $spacing-sm;
  border-bottom: 1px solid $border-light;

  .ok-text {
    color: $success-color;
  }

  .warn-text {
    color: $warning-color;
  }

  .err-text {
    color: $danger-color;
  }
}

.checklist-section-title {
  font-weight: 600;
  color: $text-primary;
  margin: $spacing-sm 0;
}

.case-checklist,
.issue-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.case-check-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs 0;

  .status-ok {
    color: $success-color;
  }

  .case-name {
    font-weight: 500;
    color: $text-primary;
  }

  .result-count {
    margin-left: auto;
    font-size: $font-size-xs;
    color: $text-secondary;
  }
}

.empty-list {
  color: $text-secondary;
  padding: $spacing-xs 0;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-xs;
  padding: $spacing-xs 0;
  line-height: 1.5;

  &.is-error {
    color: $danger-color;
  }

  &.is-warning {
    color: $warning-color;
  }

  span {
    color: $text-regular;
  }
}

@media (max-width: $breakpoint-md) {
  .baseline-toolbar .el-button {
    flex: 1 1 auto;
  }

  .case-check-item .result-count {
    margin-left: 0;
    width: 100%;
  }
}
</style>

<style lang="scss">
// 窄屏时对话框自适应，保持内容稳定不溢出
.baseline-dialog {
  width: 92vw !important;
  max-width: 720px;
}
</style>
