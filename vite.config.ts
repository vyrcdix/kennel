import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Ports are env-driven so a second checkout of this branch can run a parallel
// test instance alongside prod for local dev (see docs/skin-life-build-plan.md
// — parallel test deployment). Defaults match the single-instance setup.
//   KENNEL_API_PORT — the backend the /api proxy targets (server default 8421)
//   KENNEL_DEV_PORT — the vite dev server's own port (vite default 5173)
// loadEnv (prefix '') reads the shell environment without needing @types/node.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiPort = Number(env.KENNEL_API_PORT ?? 8421);
  const devPort = env.KENNEL_DEV_PORT ? Number(env.KENNEL_DEV_PORT) : undefined;

  return {
    plugins: [react()],
    server: {
      ...(devPort ? { port: devPort } : {}),
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
