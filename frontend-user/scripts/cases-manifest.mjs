// 规范化清单（manifest）共享逻辑：供 check-cases.mjs 与 export-cases.mjs 使用
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateCases, caseKey } from '../src/data/validateCases.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const ROOT_DIR = join(__dirname, '..')
export const DATA_FILE = join(ROOT_DIR, 'src', 'data', 'cases.json')
export const MANIFEST_FILE = join(ROOT_DIR, 'cases.manifest.json')

// 递归排序对象键，生成与键序无关的规范化 JSON，保证清单可复现
export function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key])
        return acc
      }, {})
  }
  return value
}

export function contentHash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')
}

// 由规范化后的案例数组生成清单
export function buildManifest(cases) {
  return {
    version: 1,
    source: 'src/data/cases.json',
    caseCount: cases.length,
    checksum: contentHash(cases),
    cases: cases.map((item) => ({
      key: caseKey(item.title),
      title: item.title,
      industry: item.industry,
      tag: item.tag,
      results: item.results.length,
      hash: contentHash(item)
    }))
  }
}

// 读取并校验基线文件；文件不存在/为空/字段不完整/格式不兼容时返回 ok: false
export function loadDataFile(file = DATA_FILE) {
  if (!existsSync(file)) {
    return { ok: false, errors: [`案例数据文件不存在：${file}`], cases: [] }
  }
  const text = readFileSync(file, 'utf8')
  return validateCases(text)
}

export function loadManifest(file = MANIFEST_FILE) {
  if (!existsSync(file)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

export function writeManifest(manifest, file = MANIFEST_FILE) {
  writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
}
