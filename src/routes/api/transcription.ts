import type { APIEvent } from "@solidjs/start/server";
import { json } from "@solidjs/router";
import { YouTubeTranscriptApi } from "youtube-transcript-api-js";

interface TranscriptionBody {
  id: string;
}

export async function POST({ request }: APIEvent) {
  const { id }: TranscriptionBody = await request.json();
  const api = new YouTubeTranscriptApi();

  try {
    const info = await api.fetch(id);
    const transcriptData = info.snippets.map((e) => e.text).join(" ");

    if (transcriptData.length === 0) {
      return json(
        {
          error: "no response",
        },
        { status: 400 },
      );
    }

    return json({
      result: transcriptData,
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return json({
        error: `ERROR_${e.message}`,
      });
    }
  }
}
