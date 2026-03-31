import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";
import {
  GenericProxyConfig,
  YouTubeTranscriptApi,
  type FetchedTranscript,
} from "youtube-transcript-api-js";

const wordAction = action(async (q: string) => {
  "use server";

  const system = dedent`
  Here is output format

  **Meaning**
  **Part of Speech**
  **Examples**
    1.
    2.
    3.
    4.
    5.
  `;
  const prompt = `Please define the meaning and part of speech for this word, and provide five example sentences.: ${q}`;
  const { textStream } = streamText({
    system,
    model: deepseek(process.env.DEEPSEEK_API)("deepseek-chat"),
    prompt,
  });

  return {
    stream: textStream,
  };
}, "word");

const paragraphAction = action(async (q: string) => {
  "use server";

  const system = dedent`
  Here is output format

  **Overral Analysis**
  **Grammar**
  **Spelling**
  **Improvements**
    1.
    2.
    3.
    4.
    5.
  **Improved Sentence**
    1.
    2.
    3.
    4.
    5.
  `;
  const prompt = `Please analyze my sentence, provide an evaluation and spell check, and suggest an improved version.: ${q}`;
  const { textStream } = streamText({
    system,
    model: deepseek(process.env.DEEPSEEK_API)("deepseek-chat"),
    prompt,
  });

  return {
    stream: textStream,
  };
}, "paragraph");

type TResult = {
  ok?: boolean;
  message: string;
};

const transcriptionAction = action(async (id: string) => {
  "use server";

  let message = "";
  const handleSnippets = (output: FetchedTranscript) =>
    output.snippets.map((sn) => sn.text).join(" ");

  try {
    if (import.meta.env.DEV) {
      const api = new YouTubeTranscriptApi();
      message = await api.fetch(id).then(handleSnippets);
    } else {
      const server = process.env.PROXY;
      const proxyConfig = new GenericProxyConfig(server, server);
      const api = new YouTubeTranscriptApi(proxyConfig);
      message = await api.fetch(id).then(handleSnippets);
    }

    return {
      ok: true,
      message,
    } satisfies TResult;
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { ok: false, message: e.message } satisfies TResult;
    }
  }
});

const analyzeAction = action(async (transcription: string) => {
  "use server";

  const system = dedent`
  Here is output format

  **Brief Summary**
  **Repetitive Words**
  **Commonly used Sentences**
  `;
  const prompt = `Please analyze sentences: ${transcription}`;
  const { textStream } = streamText({
    system,
    model: deepseek(process.env.DEEPSEEK_API)("deepseek-chat"),
    prompt,
  });

  return {
    stream: textStream,
  };
});

export { wordAction, analyzeAction, paragraphAction, transcriptionAction };
