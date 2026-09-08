import { defineConfig } from 'vite'

import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

const config = defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    viteReact(),
  ],
})

export default config
