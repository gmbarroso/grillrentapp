import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react-swc"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    define: {
      "process.env": env,
    },
    server: {
      proxy: {
        "/api": {
          target: "https://grillrentbff.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  }
})

