import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT and BASE_PATH are optional so the app builds and runs on any host.
// Replit still sets both, so existing behaviour there is unchanged.
const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

// The Replit-only dev plugins are optional. They load only when running inside
// a Repl, and a missing package never breaks a build on another host.
async function loadReplitPlugins() {
  if (process.env.REPL_ID === undefined) return [];
  const plugins = [];
  try {
    const { default: runtimeErrorOverlay } = await import(
      '@replit/vite-plugin-runtime-error-modal'
    );
    plugins.push(runtimeErrorOverlay());
    if (process.env.NODE_ENV !== 'production') {
      const { cartographer } = await import('@replit/vite-plugin-cartographer');
      const { devBanner } = await import('@replit/vite-plugin-dev-banner');
      plugins.push(
        cartographer({ root: path.resolve(import.meta.dirname, '..') }),
        devBanner(),
      );
    }
  } catch {
    // Not installed or not needed outside Replit.
  }
  return plugins;
}

const replitPlugins = await loadReplitPlugins();

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...replitPlugins,
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
