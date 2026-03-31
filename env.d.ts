declare namespace NodeJS {
  interface ProcessEnv {
    readonly DEEPSEEK_API: string;
    readonly SUPADATA_API: string;
    readonly PROD: string;
  }
}
