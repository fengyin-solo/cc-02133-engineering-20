import { validateCases } from './validateCases.js'

/**
 * 决定最终使用的案例数据。
 * 文件为空、字段不完整或格式不兼容时，一律回退到 fallback（现有案例），
 * 绝不使用无效数据覆盖。
 *
 * @param {string|unknown} raw 基线文件原文或已解析数据
 * @param {object[]} fallback 内置现有案例
 * @returns {{ cases: object[], source: 'file' | 'fallback', errors: string[] }}
 */
export function resolveCases(raw, fallback) {
  const result = validateCases(raw)
  if (result.ok) {
    return { cases: result.cases, source: 'file', errors: [] }
  }
  return { cases: fallback, source: 'fallback', errors: result.errors }
}
