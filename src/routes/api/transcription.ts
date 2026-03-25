import type { APIEvent } from "@solidjs/start/server";
import { json } from "@solidjs/router";
import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript-plus";

interface TranscriptionBody {
  q: string;
}

export async function POST({ request }: APIEvent) {
  const { q }: TranscriptionBody = await request.json();

  try {
    const transcription = await fetchTranscript(q, {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
    });
    const result = transcription.map((tscript) => tscript.text).join(" ");
    if (result.length === 0) {
      return json(
        {
          error: "no response",
        },
        { status: 400 },
      );
    }

    return json({
      result,
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e instanceof YoutubeTranscriptVideoUnavailableError) {
        return json(
          {
            error: `Video is unavailable ${e.videoId}`,
          },
          { status: 400 },
        );
      } else if (e instanceof YoutubeTranscriptDisabledError) {
        return json(
          {
            error: `Transcripts are disabled: ${e.videoId}`,
          },
          { status: 400 },
        );
      } else if (e instanceof YoutubeTranscriptNotAvailableError) {
        return json(
          {
            error: `No transcript available: ${e.videoId}`,
          },
          { status: 400 },
        );
      } else if (e instanceof YoutubeTranscriptNotAvailableLanguageError) {
        return json(
          {
            error: `Language not available ${e.lang}, ${e.availableLangs}`,
          },
          { status: 400 },
        );
      } else {
        return json(
          {
            error: `An unexpected error occurred: ${e.message}`,
          },
          { status: 400 },
        );
      }
    }
    return json(
      {
        error: "panic!",
      },
      { status: 500 },
    );
  }
}
