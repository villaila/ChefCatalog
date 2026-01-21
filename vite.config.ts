
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Cargamos las variables de entorno según el modo (development/production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      // Mapeamos cualquier variante de la llave al estándar process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
    }
  };
});
