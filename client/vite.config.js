import path from 'node:path'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), '..'), '')
  const clientEnv = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    clientEnv.SUPABASE_URL ||
    rootEnv.SUPABASE_URL ||
    ''
  ).trim()

  const supabaseAnonKey = (
    process.env.SUPABASE_ANON_KEY ||
    clientEnv.SUPABASE_ANON_KEY ||
    rootEnv.SUPABASE_ANON_KEY ||
    ''
  ).trim()

  const googleMapsApiKey = (
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    clientEnv.VITE_GOOGLE_MAPS_API_KEY ||
    rootEnv.VITE_GOOGLE_MAPS_API_KEY ||
    clientEnv.GOOGLE_MAPS_API_KEY ||
    rootEnv.GOOGLE_MAPS_API_KEY ||
    ''
  ).trim()

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(googleMapsApiKey),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  }
})
