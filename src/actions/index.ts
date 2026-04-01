import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";
import { Supadata, type TranscriptChunk } from "@supadata/js";

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
  **Grammatical Errors (without any explaination)**
  {Original sentence}
  => {Corrected sentence}
  **Explains**
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
  const supadata = new Supadata({
    apiKey: process.env.SUPADATA_API,
  });

  const fetchTransciprt = async () => {
    const transcriptResult = await supadata.transcript({
      url: `https://www.youtube.com/watch?v=${id}`,
      lang: "en",
      text: true,
      mode: "auto",
    });
    return transcriptResult;
  };

  const getContent = (content: string | TranscriptChunk[] | undefined) => {
    if (Array.isArray(content)) {
      return content.map((e) => e.text).join(" ");
    } else {
      return content ?? "";
    }
  };

  try {
    const transcriptResult = await fetchTransciprt();

    if ("jobId" in transcriptResult) {
      const jobResult = await supadata.transcript.getJobStatus(transcriptResult.jobId);
      if (jobResult.status === "completed") {
        message = getContent(jobResult.result?.content);
      } else if (jobResult.status === "failed") {
        message = "Transcript failed:" + jobResult.error;
      } else {
        message = "Job status:" + jobResult.status;
      }
    } else {
      message = getContent(transcriptResult.content);
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
  **Words (noun, verb, adjective only, using markdown table format)**
  **Paragraphs**
  `;
  const prompt = `Please analyze sentences and split wrods and paragraphs: ${transcription}`;
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
