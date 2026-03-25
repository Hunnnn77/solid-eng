import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
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

const transcriptionAction = action(async (dialogValue: string) => {
  "use server";

  try {
    const transcription = await fetchTranscript(dialogValue, {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
    });
    const result = transcription.map((tscript) => tscript.text).join(" ");
    if (result.length === 0) {
      return {
        ok: false,
        error: "no response",
      };
    }

    return {
      ok: true,
      result,
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e instanceof YoutubeTranscriptVideoUnavailableError) {
        return {
          ok: false,
          error: `Video is unavailable ${e.videoId}`,
        };
      } else if (e instanceof YoutubeTranscriptDisabledError) {
        return {
          ok: false,
          error: `Transcripts are disabled: ${e.videoId}`,
        };
      } else if (e instanceof YoutubeTranscriptNotAvailableError) {
        return {
          ok: false,
          error: `No transcript available: ${e.videoId}`,
        };
      } else if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
        return {
          ok: false,
          error: `Language not available ${e.lang}, ${e.availableLangs}`,
        };
      } else {
        return {
          ok: false,
          error: `An unexpected error occurred: ${e.message}`,
        };
      }
    }
    return {
      ok: false,
      error: "panic!",
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
