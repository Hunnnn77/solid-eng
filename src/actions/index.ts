import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";

type TResp = { error: string } | { result: string };

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

const transcriptionAction = action(async (id: string) => {
  "use server";

  try {
    const resp: TResp = await fetch(
      `${import.meta.env ? "http://localhost:3000" : process.env.PROD}/api/transcription`,
      {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      },
    ).then((r) => r.json());

    if ("error" in resp) {
      return {
        ok: false,
        error: `YOUTUBE_ERR: ${resp.error}`,
      };
    }
    return {
      ok: true,
      result: resp.result,
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return {
        ok: false,
        error: `Fetch_ERR: ${e.message}`,
      };
    }
    return {
      ok: false,
      error: `Panic!`,
    };
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
