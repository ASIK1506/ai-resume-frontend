<<<<<<< HEAD
// ===========================================
// vite.config.ts
=======
// // ===========================================
// // vite.config.ts
// // ===========================================
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// export default defineConfig({
//   plugins: [react()],
//   resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
// });

// ===========================================
// vite.config.ts (UPDATED WITH PROXY)
>>>>>>> 50b91e41e56f2b2acf7a6ca1fd16cf5fbb597d7b
// ===========================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
=======

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,

    // ⭐ IMPORTANT: Proxy all /api requests -> FastAPI backend
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
>>>>>>> 50b91e41e56f2b2acf7a6ca1fd16cf5fbb597d7b
