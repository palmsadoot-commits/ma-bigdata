import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,       // บังคับให้รันที่ Port 80
    strictPort: true, // ถ้า Port 80 ไม่ว่าง ให้แจ้ง Error (ไม่สุ่มเปลี่ยน Port)
    host: true      // อนุญาตให้เครื่องอื่นในวง LAN เข้าใช้งานเว็บนี้ได้ด้วย
  }
})