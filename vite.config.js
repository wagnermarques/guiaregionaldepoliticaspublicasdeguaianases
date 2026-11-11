import { defineConfig, loadEnv, mergeConfig } from 'vite'
import { appshellConfig } from 'fzl-fund-appshell--lit/vite'
import appshell from './appshell.config.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return mergeConfig(
    appshellConfig({
      ...appshell,
      base: env.VITE_BASE_PATH || appshell.base || '/',
    }),
    {},
  )
})
