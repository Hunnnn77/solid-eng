declare namespace NodeJS {
  interface ProcessEnv {
    readonly DEEPSEEK_API: string;
    readonly PROD: string;
    readonly PROXY: string;
  }
}
