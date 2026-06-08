import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ✅ Path ไปยังไฟล์ใบรับรอง SSL (ถอยกลับ 2 ชั้น)
const certPath = path.resolve(__dirname, '../../backend/certs')
const httpsOptions = {
  key: fs.existsSync(path.join(certPath, 'mol.go.th.key')) ? fs.readFileSync(path.join(certPath, 'mol.go.th.key')) : null,
  cert: fs.existsSync(path.join(certPath, 'star_mol_go_th.crt')) ? fs.readFileSync(path.join(certPath, 'star_mol_go_th.crt')) : null,
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, 
    host: true,
    // รัน Vite ในโหมด HTTPS เพื่อความปลอดภัย
    https: (httpsOptions.key && httpsOptions.cert) ? httpsOptions : false,
    allowedHosts: ['ma-bigdata.mol.go.th', '.mol.go.th'],
    proxy: {
      '/api': {
        // ✅ ใช้ https:// และ localhost พอร์ต 443
        target: 'https://localhost:443',
        changeOrigin: true,
        secure: false, // สำคัญ: ข้ามการตรวจสอบความถูกต้องของ Cert บน Local
      },
      '/uploads': {
        target: 'https://localhost:443',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://localhost:443',
        changeOrigin: true,
        secure: false,
        ws: true, // ✅ รองรับ WebSocket สำหรับ Socket.io
      }
    }
  }
})
