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
          target: env.REACT_APP_BFF_URL || "https://grillrentbff.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          // secure: false,
        },
        "/api-staging": {
          target: env.REACT_APP_BFF_URL_STAGING || "https://grillrentbffv2-staging.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-staging/, ""),
          secure: false,
        },
      },
    },
  }
})
