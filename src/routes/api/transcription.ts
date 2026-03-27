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
  id: string;
}

export async function POST({ request }: APIEvent) {
  const { id }: TranscriptionBody = await request.json();

  try {
    const script = (await fetchTranscript(id)).map((e) => e.text).join(" ");

    if (!script) {
      return json(
        {
          error: "no response",
        },
        { status: 400 },
      );
    }
    return json({
      result: script,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error instanceof YoutubeTranscriptVideoUnavailableError) {
        return json({ error: `Video is unavailable: ${error.videoId}` }, { status: 404 });
      } else if (error instanceof YoutubeTranscriptDisabledError) {
        return json({ error: `Transcripts are disabled: ${error.videoId}` }, { status: 403 });
      } else if (error instanceof YoutubeTranscriptNotAvailableError) {
        return json({ error: `No transcript available: ${error.videoId}` }, { status: 404 });
      } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
        return json(
          { error: `Language not available: ${error.lang} ${error.availableLangs}` },
          { status: 422 },
        );
      } else {
        return json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
      }
    }

    return json({ error: "An unexpected non-error exception occurred." }, { status: 500 });
  }
}
