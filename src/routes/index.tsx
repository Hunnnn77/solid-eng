import { Title } from "@solidjs/meta";
import { action, useAction } from "@solidjs/router";
import { batch, createSignal, onMount, Show, splitProps, type Component } from "solid-js";
import "./index.css";
import { Input } from "~/components/Input";
import type { TAction } from "~/types";
import { streamText } from "ai";
import dedent from "dedent";
import { marked } from "marked";
import { deepseek } from "~/client/llm";
import { Button } from "~/components/Button";

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

export default function Home() {
  return (
    <div class="app-shell">
      <Title>English Studio</Title>
      <AsideComponent />
      <MainComponent />
    </div>
  );
}

const MainComponent: Component = () => {
  const word = useAction(wordAction);
  const paragraph = useAction(paragraphAction);

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
  word: TAction<typeof wordAction>;
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

    let streamed = "";
    for await (const part of (await w(query)).stream) {
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

        <Button disabled={disabled()} collect={collectWordStream} />
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
  paragraph: TAction<typeof paragraphAction>;
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

    let streamed = "";
    for await (const part of (await p(query)).stream) {
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

        <Button disabled={disabled()} collect={collectParagraphStream} />
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

const AsideComponent: Component = () => {
  const [dialogEl, setDialogEl] = createSignal<HTMLDialogElement>();

  const [dialogValue, setDialogValue] = createSignal("");
  const [url, setUrl] = createSignal("");

  function open() {
    setUrl("");
    dialogEl()?.showModal();
  }

  function close() {
    const dialog = dialogEl();
    if (!dialog) {
      return;
    }

    if (url().trim().length > 0) {
      dialog.close(url().trim());
      return;
    }

    dialog.close();
  }

  onMount(() => {
    dialogEl()?.addEventListener("close", () => {
      const dialog = dialogEl();
      if (dialog?.returnValue && dialog.returnValue !== "default") {
        setDialogValue(dialog.returnValue);
      }
    });
  });

  return (
    <aside class="side-pane panel-surface panel-border panel-shadow">
      <p class="eyebrow">Utility</p>
      <h2>Transcript Source</h2>
      <p class="side-copy">
        Save a YouTube URL here and keep your transcript source visible while writing.
      </p>

      <button class="app-button" type="button" onclick={open}>
        Add YouTube URL
      </button>

      <Show when={dialogValue().length > 0}>
        <div class="saved-link">
          <p>Current source</p>
          <a href={dialogValue()} target="_blank" rel="noreferrer">
            {dialogValue()}
          </a>
        </div>
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
          <button
            class="app-button app-button-muted"
            type="button"
            onclick={() => dialogEl()?.close()}
          >
            Cancel
          </button>
          <button class="app-button" type="button" onclick={close}>
            Save
          </button>
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
