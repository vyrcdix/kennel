import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Ports are env-driven so a second checkout of this branch can run a parallel
// test instance alongside prod (see docs/deploy-tidewater.md). Defaults match
// the single-instance setup.
//   KENNEL_API_PORT     — backend the /api proxy targets (server default 8421)
//   KENNEL_DEV_PORT     — vite dev server's own port (vite default 5173)
//   KENNEL_PREVIEW_PORT — vite preview server's port (vite default 4173)
// Both `server` (dev) and `preview` (serves the built dist/) proxy /api +
// /mcp to the backend — preview is the local stand-in for the prod model
// (Caddy file_server over dist/ + reverse_proxy of /api,/mcp to the node).
// loadEnv (prefix '') reads the shell environment without needing @types/node.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiPort = Number(env.KENNEL_API_PORT ?? 8421);
  const devPort = env.KENNEL_DEV_PORT ? Number(env.KENNEL_DEV_PORT) : undefined;
  const previewPort = env.KENNEL_PREVIEW_PORT ? Number(env.KENNEL_PREVIEW_PORT) : undefined;
  const proxy = {
    '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true },
    '/mcp': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true },
  };

  return {
    plugins: [react()],
    server: {
      ...(devPort ? { port: devPort } : {}),
      proxy,
    },
    preview: {
      ...(previewPort ? { port: previewPort } : {}),
      proxy,
    },
  };
});
