// 成功案例数据校验与规范化
// 纯 ESM、无副作用，同时被以下两处使用，保证判定规则一致：
//   - 前端运行时：src/data/cases.js（无效时回退内置案例）
//   - 构建检查：scripts/check-cases.mjs（标出缺失/重复案例，阻止配置漂移）

// 每个案例必须包含的非空字符串字段（行业、挑战、方案等）
export const CASE_REQUIRED_FIELDS = [
  'title',
  'industry',
  'tag',
  'description',
  'challenge',
  'solution',
  'gradient'
]

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

// 规范化文本：去首尾空白并折叠连续空白，用于生成稳定的案例标识
export function normalizeText(value) {
  return String(value).trim().replace(/\s+/g, ' ')
}

// 案例唯一标识（基于规范化后的标题）
export function caseKey(title) {
  return normalizeText(title)
}

function safeParse(text, errors) {
  try {
    return JSON.parse(text)
  } catch (error) {
    errors.push(`案例文件格式不兼容：JSON 解析失败（${error.message}）`)
    return null
  }
}

/**
 * 校验并规范化案例数据。
 * @param {string|unknown} raw 文件原文（字符串）或已解析的数据
 * @returns {{ ok: boolean, errors: string[], warnings: string[], cases: object[], duplicates: object[] }}
 *   ok 为 false 时调用方必须回退到现有案例，不得使用部分数据覆盖。
 */
export function validateCases(raw) {
  const errors = []
  const warnings = []

  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) {
    return { ok: false, errors: ['案例文件为空'], warnings, cases: [], duplicates: [] }
  }

  const list = typeof raw === 'string' ? safeParse(raw, errors) : raw
  if (list == null) {
    return { ok: false, errors, warnings, cases: [], duplicates: [] }
  }
  if (!Array.isArray(list)) {
    return { ok: false, errors: ['案例文件格式不兼容：顶层必须是案例数组'], warnings, cases: [], duplicates: [] }
  }
  if (list.length === 0) {
    return { ok: false, errors: ['案例文件为空：未定义任何案例'], warnings, cases: [], duplicates: [] }
  }

  const cases = []
  const seen = new Map()

  list.forEach((item, index) => {
    const label = `案例 #${index + 1}` + (item && isNonEmptyString(item.title) ? `「${item.title}」` : '')

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} 格式不兼容：必须是对象`)
      return
    }

    const missing = CASE_REQUIRED_FIELDS.filter((field) => !isNonEmptyString(item[field]))
    if (missing.length > 0) {
      errors.push(`${label} 字段不完整：缺少或为空 ${missing.join(', ')}`)
      return
    }

    if (!Array.isArray(item.results) || item.results.length === 0) {
      errors.push(`${label} 字段不完整：results（实施效果）必须是非空数组`)
      return
    }

    const results = []
    let resultsInvalid = false
    item.results.forEach((result, resultIndex) => {
      const valueInvalid =
        result == null ||
        typeof result !== 'object' ||
        result.value === undefined ||
        result.value === null ||
        String(result.value).trim() === ''
      const labelInvalid = result == null || typeof result !== 'object' || !isNonEmptyString(result.label)
      if (valueInvalid || labelInvalid) {
        errors.push(`${label} 的实施效果第 ${resultIndex + 1} 项不完整：需要非空的 value 与 label`)
        resultsInvalid = true
        return
      }
      results.push({ value: String(result.value).trim(), label: result.label.trim() })
    })
    if (resultsInvalid) {
      return
    }

    const normalized = {
      title: item.title.trim(),
      industry: item.industry.trim(),
      tag: item.tag.trim(),
      description: item.description.trim(),
      challenge: item.challenge.trim(),
      solution: item.solution.trim(),
      gradient: item.gradient.trim(),
      results
    }

    const key = caseKey(normalized.title)
    seen.set(key, (seen.get(key) || 0) + 1)
    cases.push(normalized)
  })

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([title, count]) => ({ title, count }))
  duplicates.forEach((dup) => {
    errors.push(`重复案例：「${dup.title}」出现 ${dup.count} 次`)
  })

  return { ok: errors.length === 0, errors, warnings, cases, duplicates }
}
