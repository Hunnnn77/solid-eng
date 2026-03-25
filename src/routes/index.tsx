import { Title } from "@solidjs/meta";
import { useAction } from "@solidjs/router";
import { batch, createSignal, onMount, Show, splitProps, type Component } from "solid-js";
import "./index.css";
import { Input } from "~/components/Input";
import type { TAction } from "~/types";
import { marked } from "marked";
import { Button } from "~/components/Button";
import { analyzeAction, paragraphAction, transcriptionAction, wordAction } from "~/actions";

export default function Home() {
  const transcription = useAction(transcriptionAction);
  const analyze = useAction(analyzeAction);
  const word = useAction(wordAction);
  const paragraph = useAction(paragraphAction);

  return (
    <div class="app-shell">
      <Title>English Studio</Title>
      <LangComponent word={word} paragraph={paragraph} />
      <YoutubeComponent transcription={transcription} analyze={analyze} />
    </div>
  );
}

const LangComponent: Component<{
  word: TAction<string, typeof wordAction>;
  paragraph: TAction<string, typeof paragraphAction>;
}> = ({ word, paragraph }) => {
  return (
    <main class="main-pane">
      <header class="hero-card panel-surface panel-border panel-shadow">
        <p class="eyebrow">Writing companion</p>
        <h1 class="hero-title">English Studio</h1>
        <p class="hero-subtitle">
          Look up precise meanings and improve entire paragraphs with guided AI feedback.
        </p>
      </header>

      <div class="tool-grid">
        <WordSearcher word={word} />
        <ParagraphWriting paragraph={paragraph} />
      </div>
    </main>
  );
};

const WordSearcher: Component<{
  word: TAction<string, typeof wordAction>;
}> = ({ word: w }) => {
  const [disabled, setDisabled] = createSignal(false);
  const [wordValue, setWordValue] = createSignal("");
  const [answerByWordValue, setAnswerByWordValue] = createSignal("");

  async function collectWordStream() {
    const query = wordValue().trim();
    if (!query || disabled()) {
      return;
    }

    batch(() => {
      setDisabled(true);
      setAnswerByWordValue("");
    });

    const stream = (await w(query)).stream;
    let streamed = "";

    for await (const part of stream) {
      streamed += part;
      setAnswerByWordValue(marked.parse(streamed) as string);
    }

    batch(() => {
      setWordValue("");
      setDisabled(false);
    });
  }

  return (
    <section class="tool-card panel-surface panel-border panel-shadow">
      <div class="tool-head">
        <div>
          <p class="eyebrow">Word Explorer</p>
          <h2>Search a word</h2>
        </div>

        <Button disabled={disabled()} callback={collectWordStream} />
      </div>

      <Input
        disabled={disabled()}
        value={wordValue()}
        setter={setWordValue}
        placeholder="Type a word like resilient"
      />

      <Show when={answerByWordValue().length > 0}>
        <Prose text={answerByWordValue()} />
      </Show>
    </section>
  );
};

const ParagraphWriting: Component<{
  paragraph: TAction<string, typeof paragraphAction>;
}> = ({ paragraph: p }) => {
  const [disabled, setDisabled] = createSignal(false);
  const [paragraphValue, setParagraphValue] = createSignal("");
  const [answerByParagraphValue, setAnswerByParagraphValue] = createSignal("");

  async function collectParagraphStream() {
    const query = paragraphValue().trim();
    if (!query || disabled()) {
      return;
    }

    batch(() => {
      setDisabled(true);
      setAnswerByParagraphValue("");
    });

    const stream = (await p(query)).stream;
    let streamed = "";

    for await (const part of stream) {
      streamed += part;
      setAnswerByParagraphValue(marked.parse(streamed) as string);
    }

    batch(() => {
      setParagraphValue("");
      setDisabled(false);
    });
  }

  return (
    <section class="tool-card panel-surface panel-border panel-shadow">
      <div class="tool-head">
        <div>
          <p class="eyebrow">Draft Doctor</p>
          <h2>Polish a paragraph</h2>
        </div>

        <Button disabled={disabled()} callback={collectParagraphStream} />
      </div>

      <Input
        isTextArea
        disabled={disabled()}
        value={paragraphValue()}
        setter={setParagraphValue}
        placeholder="Paste your paragraph for grammar and clarity improvements"
      />

      <Show when={answerByParagraphValue().length > 0}>
        <Prose text={answerByParagraphValue()} />
      </Show>
    </section>
  );
};

const YoutubeComponent: Component<{
  transcription: TAction<string, typeof transcriptionAction>;
  analyze: TAction<string, typeof analyzeAction>;
}> = ({ transcription, analyze }) => {
  const [dialogEl, setDialogEl] = createSignal<HTMLDialogElement>();

  const [returnValue, setReturnValue] = createSignal("");
  const [url, setUrl] = createSignal("");

  const [transcript, setTranscript] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  function open() {
    dialogEl()?.showModal();
  }

  function close() {
    dialogEl()?.close();
  }

  function save() {
    const dialog = dialogEl();

    if (!dialog) {
      return;
    }
    if (url().trim().length === 0) {
      dialog.close();
      return;
    }
    if (returnValue().length > 0) {
      dialog.close();
      return;
    }

    dialog.close(url().trim());
  }

  onMount(() => {
    dialogEl()?.addEventListener("close", async () => {
      if (url().trim().length === 0) {
        return;
      }

      setUrl("");
      const dialog = dialogEl();

      if (
        !dialog ||
        !dialog.returnValue ||
        !dialog.returnValue.includes("?v=") ||
        !dialog.returnValue.includes("youtube.com")
      ) {
        return;
      }

      setReturnValue(dialog.returnValue);

      await transcription(returnValue()).then((r) => {
        batch(() => {
          setLoading(true);
          let transcription = r.transcription.replaceAll("&gt;", ">");
          transcription = transcription.replaceAll("&#39;", "'");

          analyze(transcription).then(async (r) => {
            let answer = "";
            for await (const a of r.stream) {
              answer += a;
              setTranscript(marked.parse(answer) as string);
            }
            setLoading(false);
          });
        });
      });
    });
  });

  return (
    <aside class="side-pane panel-surface panel-border panel-shadow">
      <p class="eyebrow">Utility</p>
      <h2>Transcript Source</h2>
      <p class="side-copy">
        Save a YouTube URL here and keep your transcript source visible while writing.
      </p>

      <Button disabled={loading()} callback={open}>
        Add YouTube URL
      </Button>

      <Show when={returnValue().length > 0}>
        <div class="saved-link">
          <p>Current source</p>
          <a href={returnValue()} target="_blank" rel="noreferrer">
            {returnValue()}
          </a>
        </div>
      </Show>

      <Show when={transcript().length > 0}>
        <Prose text={transcript()}></Prose>
      </Show>

      <dialog class="app-dialog panel-surface panel-border" ref={setDialogEl}>
        <h3>Video URL</h3>
        <input
          class="field-input"
          value={url()}
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          oninput={(e) => setUrl(e.target.value)}
        />
        <div class="dialog-actions">
          <Button callback={close}>close</Button>
          <Button callback={save}>save</Button>
        </div>
      </dialog>
    </aside>
  );
};

const Prose: Component<{
  text: string;
}> = (props) => {
  const [s] = splitProps(props, ["text"]);

  return (
    <div
      innerHTML={s.text}
      class="prose-block prose prose-invert prose-headings:font-semibold prose-headings:text-inherit prose-h1:text-xl prose-h2:text-lg prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit prose-a:text-sky-300 prose-li:marker:text-amber-400"
    ></div>
  );
};
