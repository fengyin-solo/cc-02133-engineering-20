#!/usr/bin/env node
// 导出：把内置成功案例写为可编辑的基线文件 src/data/cases.json，并同步刷新规范化清单。
// 维护者随后可直接编辑该文件（行业、挑战、方案、实施效果等），
// 下次构建时由 cases:check 校验并比对清单。

import { writeFileSync } from 'node:fs'
import { defaultCases } from '../src/data/cases.defaults.js'
import { validateCases } from '../src/data/validateCases.js'
import { DATA_FILE, MANIFEST_FILE, buildManifest, writeManifest } from './cases-manifest.mjs'

const rel = (p) => p.replace(process.cwd() + '/', '')

// 内置数据自身必须先通过校验，避免导出无效基线
const result = validateCases(defaultCases)
if (!result.ok) {
  console.error('✖ 内置案例数据未通过校验，已取消导出：')
  result.errors.forEach((line) => console.error(`  ${line}`))
  process.exit(1)
}

writeFileSync(DATA_FILE, JSON.stringify(result.cases, null, 2) + '\n', 'utf8')
writeManifest(buildManifest(result.cases))

console.log(`✔ 已导出 ${result.cases.length} 个案例到 ${rel(DATA_FILE)}`)
console.log(`✔ 规范化清单已同步：${rel(MANIFEST_FILE)}`)
