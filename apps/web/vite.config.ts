import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// One .env at the repo root serves every app (ports, VITE_* vars).
const envDir = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const port = Number(env.FE_PORT ?? 8301);
  const apiPort = Number(env.BE_PORT ?? 8300);

  return {
    envDir,
    // Router plugin must come before react(). The React Compiler runs through Babel (stable 1.0);
    // plugin-react's native `compiler: true` is still experimental.
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port,
      strictPort: true,
      proxy: {
        '/api': `http://localhost:${apiPort}`,
      },
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
