import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      manifest: {
        name: "Python Editor PWA",
        short_name: "PyEditor",
        icons: [
          {
            src: "/favicon.png",
            sizes: "144x144",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
