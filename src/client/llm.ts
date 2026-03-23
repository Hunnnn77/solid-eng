import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = (key: string) =>
  createDeepSeek({
    apiKey: key,
  });

export { deepseek };
