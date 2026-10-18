import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  let root = process.cwd();
  let outDir = 'dist';
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-fashion-images',
        apply: 'build',
        configResolved(config) {
          root = config.root;
          outDir = config.build.outDir;
        },
        closeBundle() {
          const source = path.resolve(root, 'src/assets/images');
          const destination = path.resolve(root, outDir, 'src/assets/images');
          if (fs.existsSync(source)) {
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            fs.cpSync(source, destination, { recursive: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
