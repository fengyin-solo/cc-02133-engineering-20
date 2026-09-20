// 成功案例数据入口
// 以 ?raw 方式读取基线文件并在运行时校验：
// 文件为空、字段不完整或格式不兼容时回退到内置案例，保证页面内容稳定不被覆盖。
// 构建发布前由 `npm run cases:check`（prebuild）先做严格校验并生成规范化清单。

import casesRaw from './cases.json?raw'
import { defaultCases } from './cases.defaults.js'
import { resolveCases } from './resolveCases.js'

function deepFreezeCases(list) {
  return Object.freeze(
    list.map((item) =>
      Object.freeze({
        ...item,
        results: Object.freeze(item.results.map((result) => Object.freeze({ ...result })))
      })
    )
  )
}

const resolved = resolveCases(casesRaw, defaultCases)

if (resolved.source === 'fallback') {
  // 不中断渲染，仅在控制台提示，页面继续展示现有案例
  console.warn('[cases] 案例基线文件无效，已回退到内置案例：', resolved.errors)
}

// 冻结后的稳定数据：首次进入、前进后退、窄屏切换渲染内容均一致
export const cases = deepFreezeCases(resolved.cases)
export const casesSource = resolved.source

export default cases
