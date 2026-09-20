import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  EMPTY_FILE_ERROR,
  buildBaselinePayload,
  buildCheckReport,
  evaluateBaseline,
  parseBaseline,
  serializeBaseline
} from '../src/data/caseBaseline.js'
import { defaultCases } from '../src/data/caseData.js'

const validCase = {
  title: '测试案例',
  industry: '电商物流',
  tag: 'ecommerce',
  description: '案例描述',
  challenge: '面临挑战',
  solution: '解决方案',
  gradient: 'linear-gradient(135deg, #aaa 0%, #bbb 100%)',
  results: [{ value: '10%', label: '效率提升' }]
}

function baselineText(cases, extra = {}) {
  return JSON.stringify({ formatVersion: 1, exportedAt: '2026-09-01T00:00:00.000Z', cases, ...extra })
}

describe('基线解析', () => {
  it('空文件被拒绝且不产生数据', () => {
    for (const text of ['', '   ', '\n\t']) {
      const result = parseBaseline(text)
      assert.equal(result.ok, false)
      assert.equal(result.error, EMPTY_FILE_ERROR)
    }
  })

  it('非法 JSON 被拒绝', () => {
    const result = parseBaseline('{不是json')
    assert.equal(result.ok, false)
    assert.match(result.error, /合法的 JSON/)
  })

  it('根节点结构不兼容被拒绝', () => {
    assert.equal(parseBaseline('[]').ok, false)
    assert.equal(parseBaseline('"cases"').ok, false)
    assert.equal(parseBaseline('null').ok, false)
  })

  it('formatVersion 不兼容被拒绝', () => {
    const result = parseBaseline(baselineText([validCase], { formatVersion: 99 }))
    assert.equal(result.ok, false)
    assert.match(result.error, /formatVersion/)
  })

  it('cases 缺失或为空数组被拒绝', () => {
    assert.equal(parseBaseline(JSON.stringify({ formatVersion: 1 })).ok, false)
    assert.equal(parseBaselineSafeEmpty().ok, false)
  })
})

function parseBaselineSafeEmpty() {
  return parseBaseline(baselineText([]))
}

describe('案例字段校验', () => {
  it('完整合法案例通过并被规范化（去空白、数值指标转字符串）', () => {
    const raw = { ...validCase, results: [{ value: 42, label: ' 提升 ' }] }
    const report = buildCheckReport([raw])
    assert.equal(report.ok, true)
    assert.equal(report.cases[0].results[0].value, '42')
    assert.equal(report.cases[0].results[0].label, '提升')
  })

  it('任一字段缺失都记为错误且不规范化该案例', () => {
    for (const field of ['title', 'industry', 'tag', 'description', 'challenge', 'solution', 'results']) {
      const item = { ...validCase }
      delete item[field]
      const report = buildCheckReport([item])
      assert.equal(report.ok, false, `${field} 缺失应阻断`)
      assert.ok(report.errors.some((e) => e.message.includes(field === 'results' ? '实施效果' : '')))
      assert.equal(report.cases.length, 0)
    }
  })

  it('空白字符串字段视为缺失', () => {
    const report = buildCheckReport([{ ...validCase, challenge: '   ' }])
    assert.equal(report.ok, false)
    assert.match(report.errors[0].message, /面临挑战/)
  })

  it('实施效果条目缺 value 或 label 记为错误', () => {
    const r1 = buildCheckReport([{ ...validCase, results: [{ label: '指标' }] }])
    const r2 = buildCheckReport([{ ...validCase, results: [{ value: '10%' }] }])
    const r3 = buildCheckReport([{ ...validCase, results: [] }])
    assert.equal(r1.ok, false)
    assert.equal(r2.ok, false)
    assert.equal(r3.ok, false)
  })

  it('标题重复记为重复案例错误', () => {
    const report = buildCheckReport([
      { ...validCase },
      { ...validCase, tag: 'express', industry: '快递物流' }
    ])
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((e) => e.message.includes('重复')))
  })

  it('未知标签仅警告，不阻断', () => {
    const report = buildCheckReport([{ ...validCase, tag: 'unknown-industry' }])
    assert.equal(report.ok, true)
    assert.ok(report.warnings.some((w) => w.message.includes('筛选范围')))
  })

  it('缺少 gradient 时使用兜底配色', () => {
    const item = { ...validCase }
    delete item.gradient
    const report = buildCheckReport([item])
    assert.equal(report.ok, true)
    assert.match(report.cases[0].gradient, /linear-gradient/)
  })
})

describe('配置漂移检查', () => {
  it('与内置基线一致时无任何问题', () => {
    const result = evaluateBaseline(serializeBaseline(defaultCases))
    assert.equal(result.ok, true)
    assert.equal(result.report.errors.length, 0)
    assert.equal(result.report.warnings.length, 0)
    assert.equal(result.report.cases.length, defaultCases.length)
  })

  it('缺少内置案例记为漂移警告但不阻断导入', () => {
    const partial = defaultCases.slice(1).map((c) => ({ ...c }))
    const report = buildCheckReport(partial)
    assert.equal(report.ok, true)
    assert.ok(report.warnings.some((w) => w.message.includes('配置漂移')))
  })
})

describe('导入保护', () => {
  it('evaluateBaseline 对空/坏文件返回失败，调用方不得覆盖现有案例', () => {
    assert.equal(evaluateBaseline('').ok, false)
    assert.equal(evaluateBaseline('not json').ok, false)
    assert.equal(evaluateBaseline(baselineText([{ title: '缺字段的案例' }])).ok, false)
  })

  it('合法导入产出的案例与导出再导入结果一致（往返稳定）', () => {
    const text = serializeBaseline(defaultCases)
    const first = evaluateBaseline(text)
    const second = evaluateBaseline(serializeBaseline(first.report.cases))
    assert.deepEqual(second.report.cases, first.report.cases)
    assert.ok(buildBaselinePayload(defaultCases).exportedAt)
  })
})

describe('案例存储', () => {
  let useCaseStore
  beforeEach(async () => {
    const module = await import('../src/composables/useCaseStore.js')
    useCaseStore = module.useCaseStore
  })

  it('首次进入加载内置 6 个案例', () => {
    const store = useCaseStore()
    assert.equal(store.cases.value.length, defaultCases.length)
    assert.deepEqual(store.cases.value.map((c) => c.title), defaultCases.map((c) => c.title))
  })

  it('导入失败时保持现有案例不变', () => {
    const store = useCaseStore()
    const before = JSON.stringify(store.cases.value)
    const result = store.importBaselineText('')
    assert.equal(result.ok, false)
    assert.equal(JSON.stringify(store.cases.value), before)

    const badField = store.importBaselineText(baselineText([{ ...validCase, solution: '' }]))
    assert.equal(badField.ok, false)
    assert.equal(JSON.stringify(store.cases.value), before)
  })

  it('导入合法基线后案例更新，恢复内置后回到默认', () => {
    const store = useCaseStore()
    const result = store.importBaselineText(baselineText([validCase]))
    assert.equal(result.ok, true)
    assert.equal(store.cases.value.length, 1)
    assert.equal(store.cases.value[0].title, '测试案例')

    store.resetToBuiltin()
    assert.equal(store.cases.value.length, defaultCases.length)
  })
})
