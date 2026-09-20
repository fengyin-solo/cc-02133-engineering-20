#!/usr/bin/env node
// 构建检查：校验成功案例基线文件，生成/比对规范化清单，标出缺失或重复案例。
//
// 用法：
//   node scripts/check-cases.mjs            校验数据文件并与已提交的清单比对（prebuild 自动执行）
//   node scripts/check-cases.mjs --write    接受当前数据为新基线，重写规范化清单
//
// 退出码：0 通过；1 数据无效或检测到配置漂移。
// 校验失败时不会改动清单与数据文件，避免无效内容覆盖现有案例。

import {
  DATA_FILE,
  MANIFEST_FILE,
  loadDataFile,
  loadManifest,
  writeManifest,
  buildManifest
} from './cases-manifest.mjs'

const writeMode = process.argv.includes('--write')
const rel = (p) => p.replace(process.cwd() + '/', '')

function fail(lines) {
  console.error('✖ 案例构建检查未通过：')
  lines.forEach((line) => console.error(`  ${line}`))
  process.exit(1)
}

// 1. 校验数据文件（空文件 / 字段不完整 / 格式不兼容 / 重复案例都会在此被标出）
const data = loadDataFile()
if (!data.ok) {
  fail([...data.errors, '', `数据文件：${rel(DATA_FILE)}`, '现有案例与规范化清单均未被改动。'])
}

// 2. 生成规范化清单
const manifest = buildManifest(data.cases)

if (writeMode) {
  writeManifest(manifest)
  console.log(`✔ 已接受当前案例为新基线，规范化清单已更新：${rel(MANIFEST_FILE)}（${manifest.caseCount} 个案例）`)
  process.exit(0)
}

const existing = loadManifest()
if (!existing) {
  // 首次运行：生成清单，作为后续构建的比对基线
  writeManifest(manifest)
  console.log(`✔ 案例校验通过，已生成规范化清单：${rel(MANIFEST_FILE)}（${manifest.caseCount} 个案例）`)
  process.exit(0)
}

// 3. 与已提交清单比对，标出配置漂移
const drift = []
const currentKeys = manifest.cases.map((c) => c.key)
const baselineKeys = (existing.cases || []).map((c) => c.key)

const missing = (existing.cases || []).filter((c) => !currentKeys.includes(c.key))
if (missing.length > 0) {
  drift.push('缺失案例（清单中存在但数据文件中已不存在）：')
  missing.forEach((c) => drift.push(`  - ${c.title}`))
}

const added = manifest.cases.filter((c) => !baselineKeys.includes(c.key))
if (added.length > 0) {
  drift.push('新增案例（数据文件中存在但尚未纳入清单）：')
  added.forEach((c) => drift.push(`  - ${c.title}`))
}

const changed = manifest.cases.filter((c) => {
  const base = (existing.cases || []).find((b) => b.key === c.key)
  return base && base.hash !== c.hash
})
if (changed.length > 0) {
  drift.push('内容变更（与清单基线不一致）：')
  changed.forEach((c) => drift.push(`  - ${c.title}`))
}

if (
  missing.length === 0 &&
  added.length === 0 &&
  changed.length === 0 &&
  JSON.stringify(currentKeys) !== JSON.stringify(baselineKeys)
) {
  drift.push('案例顺序与清单基线不一致。')
}

if (existing.checksum && existing.checksum !== manifest.checksum && drift.length === 0) {
  drift.push('整体校验和与清单基线不一致。')
}

if (drift.length > 0) {
  fail([...drift, '', '如确认为有意调整，请运行 npm run cases:update-manifest 更新基线清单。'])
}

console.log(`✔ 案例构建检查通过：${manifest.caseCount} 个案例，与规范化清单一致，未发现缺失、重复或漂移。`)
