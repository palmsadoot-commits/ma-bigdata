import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Path ไปยังไฟล์ใบรับรอง SSL
const certPath = path.resolve(__dirname, '../backend/certs')
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
    https: (httpsOptions.key && httpsOptions.cert) ? httpsOptions : false,
    allowedHosts: ['ma-bigdata.mol.go.th', '.mol.go.th'],
    proxy: {
      '/api': {
        target: (httpsOptions.key && httpsOptions.cert) ? 'https://localhost' : 'http://localhost:443',
        changeOrigin: true,
        secure: false, // อนุญาต Self-signed certs (ถ้ามี)
      },
      '/uploads': {
        target: (httpsOptions.key && httpsOptions.cert) ? 'https://localhost' : 'http://localhost:443',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
