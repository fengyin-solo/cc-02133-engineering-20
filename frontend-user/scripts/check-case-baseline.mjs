#!/usr/bin/env node
// 成功案例构建基线检查（构建期）
//
// 用法：
//   node scripts/check-case-baseline.mjs [基线文件路径]
//
// 不传入路径时检查内置基线（src/data/caseData.js），并与随仓维护的
// baseline/case-baseline.sample.json 对照；显式传入基线文件时执行严格校验。
// 发现任何缺失字段、重复案例或格式不兼容时以非零码退出，阻断发布。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildCheckReport, evaluateBaseline } from '../src/data/caseBaseline.js'
import { defaultCases } from '../src/data/caseData.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(scriptDir, '..')
const targetPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(rootDir, 'baseline/case-baseline.sample.json')

function printReport(report, label) {
  console.log(`\n[案例基线] ${label}`)
  console.log(
    `  总数 ${report.summary.total} / 有效 ${report.summary.valid} / 错误 ${report.summary.errors} / 警告 ${report.summary.warnings}`
  )
  if (report.issues.length === 0) {
    console.log('  无缺失或重复案例，清单规范')
  }
  for (const issue of report.issues) {
    const mark = issue.severity === 'error' ? '✗' : '!'
    console.log(`  ${mark} [${issue.severity}] ${issue.message}`)
  }
}

// 1. 内置基线自身必须始终规范
const builtinReport = buildCheckReport(
  defaultCases.map((item) => ({ ...item })),
  { strict: false }
)
printReport(builtinReport, '内置基线 src/data/caseData.js')
const builtinErrors = builtinReport.errors.length
if (builtinErrors > 0) {
  console.error(`\n内置基线存在 ${builtinErrors} 个错误，拒绝发布`)
  process.exit(1)
}

let exitCode = 0
try {
  const text = readFileSync(targetPath, 'utf8')
  const result = evaluateBaseline(text)
  if (!result.ok) {
    console.error(`\n[案例基线] ${targetPath}`)
    console.error(`  ✗ ${result.error}`)
    if (result.report) {
      printReport(result.report, '检查清单')
    }
    process.exit(1)
  }
  printReport(result.report, targetPath)
  if (result.report.errors.length > 0) {
    console.error('\n基线存在缺失字段或重复案例，拒绝发布以避免配置漂移')
    exitCode = 1
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`\n[案例基线] 基线文件不存在：${targetPath}，拒绝发布`)
  } else {
    console.error(`\n[案例基线] 读取失败：${error.message}`)
  }
  process.exit(1)
}

process.exit(exitCode)
