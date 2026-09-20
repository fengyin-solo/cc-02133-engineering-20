// 成功案例构建基线：解析、规范化与构建检查
// 纯函数、不依赖 Vue，可同时被浏览器界面与构建期脚本复用。
import { BASELINE_FORMAT_VERSION, FALLBACK_GRADIENTS, KNOWN_TAGS, defaultCases } from './caseData.js'

export const EMPTY_FILE_ERROR = '文件为空：未导入任何案例，现有案例保持不变'

const REQUIRED_FIELDS = [
  ['title', '案例名称'],
  ['industry', '所属行业'],
  ['tag', '行业分类标签'],
  ['description', '案例描述'],
  ['challenge', '面临挑战'],
  ['solution', '解决方案'],
  ['results', '实施效果']
]

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function describeType(value) {
  if (Array.isArray(value)) return '数组'
  if (value === null) return 'null'
  return typeof value
}

// 解析文件文本：空文件、非法 JSON、结构不兼容均返回错误，不返回数据
export function parseBaseline(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, error: EMPTY_FILE_ERROR, issues: [] }
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: '文件不是合法的 JSON，格式不兼容：现有案例保持不变', issues: [] }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: '基线格式不兼容：根节点必须是对象，现有案例保持不变', issues: [] }
  }
  if (data.formatVersion !== BASELINE_FORMAT_VERSION) {
    return {
      ok: false,
      error: `基线格式不兼容：formatVersion 应为 ${BASELINE_FORMAT_VERSION}，现有案例保持不变`,
      issues: []
    }
  }
  if (!Array.isArray(data.cases)) {
    return { ok: false, error: '基线格式不兼容：缺少 cases 数组，现有案例保持不变', issues: [] }
  }
  if (data.cases.length === 0) {
    return { ok: false, error: '基线为空：cases 数组没有任何案例，现有案例保持不变', issues: [] }
  }
  return { ok: true, data, issues: [] }
}

// 规范化单条案例（字段已校验为合法）
function normalizeCase(item, index) {
  const results = item.results.map((result) => ({
    value: String(result.value).trim(),
    label: String(result.label).trim()
  }))
  return {
    title: item.title.trim(),
    industry: item.industry.trim(),
    tag: item.tag.trim(),
    description: item.description.trim(),
    challenge: item.challenge.trim(),
    solution: item.solution.trim(),
    gradient: isNonEmptyString(item.gradient)
      ? item.gradient.trim()
      : FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
    results
  }
}

// 校验单条案例：缺失/类型错误记为 error，未知标签记为 warning
function validateCase(item, index, seenTitles) {
  const where = `第 ${index + 1} 条案例`
  const issues = []

  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    issues.push({ severity: 'error', message: `${where}必须是对象（实际为${describeType(item)}）` })
    return issues
  }

  for (const [field, label] of REQUIRED_FIELDS) {
    const value = item[field]
    if (value === undefined || value === null) {
      issues.push({ severity: 'error', message: `${where}${item.title ? `「${item.title}」` : ''}缺少字段：${label}` })
    } else if (field === 'results') {
      if (!Array.isArray(value) || value.length === 0) {
        issues.push({ severity: 'error', message: `${where}「${item.title}」实施效果必须是非空数组` })
      } else {
        value.forEach((result, resultIndex) => {
          const prefix = `${where}「${item.title}」第 ${resultIndex + 1} 条实施效果`
          if (typeof result !== 'object' || result === null || Array.isArray(result)) {
            issues.push({ severity: 'error', message: `${prefix}必须是对象` })
            return
          }
          if (!isNonEmptyString(result.value) && typeof result.value !== 'number') {
            issues.push({ severity: 'error', message: `${prefix}缺少指标数值（value）` })
          }
          if (!isNonEmptyString(result.label)) {
            issues.push({ severity: 'error', message: `${prefix}缺少指标名称（label）` })
          }
        })
      }
    } else if (!isNonEmptyString(value)) {
      issues.push({ severity: 'error', message: `${where}${label}必须是非空文本` })
    }
  }

  if (isNonEmptyString(item.title)) {
    const title = item.title.trim()
    if (seenTitles.has(title)) {
      issues.push({ severity: 'error', message: `${where}与其他案例标题重复：「${title}」` })
    } else {
      seenTitles.add(title)
    }
  }

  if (isNonEmptyString(item.tag) && !KNOWN_TAGS.includes(item.tag.trim())) {
    issues.push({
      severity: 'warning',
      message: `${where}「${item.title?.trim?.() ?? ''}」的分类标签 "${item.tag.trim()}" 不在筛选范围内，将无法通过标签筛选`
    })
  }

  if (item.gradient !== undefined && item.gradient !== null && !isNonEmptyString(item.gradient)) {
    issues.push({ severity: 'warning', message: `${where}「${item.title}」gradient 不是有效文本，已使用默认配色` })
  }

  return issues
}

// 与内置基线对比：发布时缺失案例视为配置漂移，记为 warning
function checkCoverage(cases) {
  const issues = []
  const titles = new Set(cases.map((c) => c.title))
  defaultCases.forEach((builtin) => {
    if (!titles.has(builtin.title)) {
      issues.push({
        severity: 'warning',
        message: `基线缺少内置案例「${builtin.title}」，发布后该案例将消失（疑似配置漂移）`
      })
    }
  })
  return issues
}

// 生成规范化检查清单。errors 存在时不得覆盖现有案例。
export function buildCheckReport(rawCases, { strict = true } = {}) {
  const issues = []
  const seenTitles = new Set()
  const validCases = []

  if (!Array.isArray(rawCases)) {
    return {
      ok: false,
      issues: [{ severity: 'error', message: 'cases 必须是数组' }],
      cases: []
    }
  }

  rawCases.forEach((item, index) => {
    const caseIssues = validateCase(item, index, seenTitles)
    const hasError = caseIssues.some((issue) => issue.severity === 'error')
    issues.push(...caseIssues)
    if (!hasError && typeof item === 'object' && item !== null) {
      validCases.push(normalizeCase(item, index))
    }
  })

  issues.push(...checkCoverage(validCases))

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  return {
    ok: strict ? errors.length === 0 : true,
    issues,
    errors,
    warnings,
    cases: validCases,
    summary: {
      total: rawCases.length,
      valid: validCases.length,
      errors: errors.length,
      warnings: warnings.length
    }
  }
}

// 一步完成：解析文件文本并构建检查清单
export function evaluateBaseline(text) {
  const parsed = parseBaseline(text)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, report: null }
  }
  const report = buildCheckReport(parsed.data.cases)
  return {
    ok: report.ok,
    error: report.ok ? null : '检查未通过：现有案例保持不变',
    report,
    source: {
      exportedAt: parsed.data.exportedAt || null,
      exportedBy: typeof parsed.data.exportedBy === 'string' ? parsed.data.exportedBy : null
    }
  }
}

// 生成可导出的规范化基线对象
export function buildBaselinePayload(cases) {
  return {
    formatVersion: BASELINE_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    cases: cases.map((item) => ({
      title: item.title,
      industry: item.industry,
      tag: item.tag,
      description: item.description,
      challenge: item.challenge,
      solution: item.solution,
      gradient: item.gradient,
      results: item.results.map((result) => ({ value: result.value, label: result.label }))
    }))
  }
}

export function serializeBaseline(cases) {
  return `${JSON.stringify(buildBaselinePayload(cases), null, 2)}\n`
}
