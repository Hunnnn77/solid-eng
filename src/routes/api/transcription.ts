import type { APIEvent } from "@solidjs/start/server";
import { json } from "@solidjs/router";
import {
  VideoUnavailable,
  TranscriptsDisabled,
  NoTranscriptFound,
  RateLimitExceeded,
  TimeoutError,
  ConnectionError,
  YouTubeTranscriptApi,
} from "youtube-transcript-api-js";

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
      if (e instanceof VideoUnavailable) {
        return json({ error: "video unavailable" }, { status: 404 });
      }

      if (e instanceof TranscriptsDisabled || e instanceof NoTranscriptFound) {
        return json({ error: "transcript unavailable" }, { status: 404 });
      }

      if (e instanceof RateLimitExceeded) {
        return json({ error: "rate limited" }, { status: 429 });
      }

      if (e instanceof TimeoutError || e instanceof ConnectionError) {
        return json({ error: "upstream connection failed" }, { status: 503 });
      }

      return json({ error: e.message }, { status: 500 });
    }
  }
}
