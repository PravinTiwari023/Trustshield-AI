import { defineConfig } from 'vite';

const backend = 'http://127.0.0.1:4173';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.origin) proxyReq.setHeader('Origin', backend);
          });
        },
      },
    },
  },
});
