import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// 构建发布前强制进行成功案例基线检查，阻断配置漂移
function caseBaselineGuard() {
  return {
    name: 'case-baseline-guard',
    apply: 'build',
    buildStart() {
      execFileSync(process.execPath, [resolve(rootDir, 'scripts/check-case-baseline.mjs')], {
        cwd: rootDir,
        stdio: 'inherit'
      })
    }
  }
}

export default defineConfig({
  plugins: [caseBaselineGuard(), vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables.scss" as *;`
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
