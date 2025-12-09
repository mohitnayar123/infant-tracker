import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __firebase_config: '""',
    __app_id: '"default-app-id"'
  }
})
