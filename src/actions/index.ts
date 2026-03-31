import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptInvalidLangError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript-plus";

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

  try {
    let message = "";

    if (import.meta.env.DEV) {
      message = await fetchTranscript(id).then((seg) => seg.map((t) => t.text).join(" "));
    } else {
      const proxyServer = process.env.PROXY;
      const destination = process.env.DESTINATION

      if (!proxyServer) {
        throw new Error("DESTINATION is not configured in production environment.");
      }

      message = await fetchTranscript(id, {
        videoFetch: async ({ url, lang, userAgent }) => {
          return fetch(`${proxyServer}?url=${encodeURIComponent(url)}`, {
            //@ts-ignore
            headers: {
              ...(lang && { "Accept-Language": lang }),
              "User-Agent": userAgent,
            },
          });
        },
        playerFetch: async ({ url, method, body, headers, lang, userAgent }) => {
          return fetch(`${proxyServer}?url=${encodeURIComponent(url)}`, {
            method,
            //@ts-ignore
            headers: {
              ...(lang && { "Accept-Language": lang }),
              "User-Agent": userAgent,
              ...headers,
            },
            body,
          });
        },
        transcriptFetch: async ({ url, lang, userAgent }) => {
          console.log(url)
          return fetch(`${proxyServer}?url=${encodeURIComponent(url)}`, {
            //@ts-ignore
            headers: {
              ...(lang && { "Accept-Language": lang }),
              "User-Agent": userAgent,
            },
          });
        },
      }).then((seg) => seg.map((t) => t.text).join(" "));
    }

    return {
      ok: true,
      message,
    } satisfies TResult;
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e instanceof YoutubeTranscriptVideoUnavailableError) {
        return `Video is unavailable: ${e.videoId}`;
      } else if (e instanceof YoutubeTranscriptDisabledError) {
        return `Transcripts are disabled: ${e.videoId}`;
      } else if (e instanceof YoutubeTranscriptNotAvailableError) {
        return `No transcript available: ${e.videoId}`;
      } else if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
        return `Language not available: ${e.lang} ${e.availableLangs}`;
      } else if (e instanceof YoutubeTranscriptInvalidLangError) {
        return `Invalid language code: ${e.lang}`;
      } else {
        return `An unexpected error occurred: ${e.message}`;
      }
    }
    return "panic!";
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
