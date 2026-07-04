export default {
  server: {
    hmr: true,
    proxy: {
      "/predict": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/login": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/samples": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
};
