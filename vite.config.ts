import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
   plugins: [react()],
   server: {
      proxy: {
      //    "/users": "http://localhost:8000",
      //    "/events": "http://localhost:8000",
         "/users": "http://api.zgloszenia-treningi.pl",
         "/events": "http://api.zgloszenia-treningi.pl",
      },
   },
});
