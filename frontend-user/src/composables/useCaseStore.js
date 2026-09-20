// 成功案例基线存储：模块级单例，跨路由前进/后退、首次进入保持内容稳定。
// 浏览器持久化只保存通过严格校验的基线；任何损坏/不兼容数据均回退内置案例。
import { computed, ref } from 'vue'
import { defaultCases } from '../data/caseData.js'
import { buildCheckReport, evaluateBaseline, serializeBaseline } from '../data/caseBaseline.js'

const STORAGE_KEY = 'zhiyun.caseBaseline.v1'

const cases = ref([...defaultCases])
const baselineMeta = ref({ source: 'builtin', importedAt: null, exportedAt: null })

function applyCases(nextCases, meta) {
  cases.value = nextCases
  baselineMeta.value = {
    source: meta?.source || 'custom',
    importedAt: meta?.importedAt || new Date().toISOString(),
    exportedAt: meta?.exportedAt || null
  }
}

// 仅把通过严格校验的基线写入持久化
function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), cases: cases.value, meta: baselineMeta.value })
    )
  } catch {
    // 存储不可用时静默降级到内存态，页面内容不受影响
  }
}

function restore() {
  let raw
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return
  }
  if (!raw) return
  try {
    const saved = JSON.parse(raw)
    const report = buildCheckReport(saved?.cases)
    if (!report.ok || report.cases.length === 0) {
      // 持久化数据已损坏/不兼容：丢弃并保留内置案例，不覆盖现有案例
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    cases.value = report.cases
    baselineMeta.value = {
      source: saved.meta?.source === 'custom' ? 'custom' : 'builtin',
      importedAt: saved.meta?.importedAt || null,
      exportedAt: saved.meta?.exportedAt || null
    }
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
}

restore()

// 当前基线的构建检查（对已加载内容同样适用，发布前可随时复核）
const currentReport = computed(() => buildCheckReport(cases.value))

export function useCaseStore() {
  // 从文件文本导入基线：任何错误都不触碰现有案例
  function importBaselineText(text) {
    const result = evaluateBaseline(text)
    if (!result.ok) {
      return { ok: false, error: result.error, report: result.report }
    }
    applyCases(result.report.cases, {
      source: 'custom',
      importedAt: new Date().toISOString(),
      exportedAt: result.source?.exportedAt || null
    })
    persist()
    return { ok: true, error: null, report: result.report }
  }

  function exportBaselineText() {
    return serializeBaseline(cases.value)
  }

  // 恢复为内置基线（仅由维护者显式触发）
  function resetToBuiltin() {
    cases.value = defaultCases.map((item) => ({ ...item, results: item.results.map((r) => ({ ...r })) }))
    baselineMeta.value = { source: 'builtin', importedAt: null, exportedAt: null }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return {
    cases,
    baselineMeta,
    currentReport,
    importBaselineText,
    exportBaselineText,
    resetToBuiltin
  }
}
