import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // tanstackStart() builds with Nitro node-server preset by default,
  // producing .output/server/index.mjs for `node .output/server/index.mjs`.
  // Override target via NITRO_PRESET env var if deploying to a different runtime.
  plugins: [tanstackStart(), react(), tailwindcss()],
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
