
// Manually defined necessary Vite types as a fallback for missing 'vite/client' reference
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface Process {
    cwd(): string;
  }
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly VITE_API_KEY: string;
  }
}
