import "./index.css";
import { Title } from "@solidjs/meta";
import { useAction } from "@solidjs/router";
import {
  batch,
  createComputed,
  createMemo,
  createSignal,
  onMount,
  Show,
  splitProps,
  type Component,
} from "solid-js";
import { Input } from "~/components/Input";
import type { TAction } from "~/types";
import { marked } from "marked";
import { Button } from "~/components/Button";
import { action } from "@solidjs/router";
import { streamText } from "ai";
import dedent from "dedent";
import { deepseek } from "~/client/llm";
import { fetchTranscript } from "youtube-transcript-plus";

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

  const transcription = await fetchTranscript(dialogValue, {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
  })
    .then((r) => r.map((trans) => trans.text).join(" "))
    .catch((e) => {
      if (e instanceof Error) {
        return e.message;
      }
      return "panic!";
    });

  return {
    transcription,
  };
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
      setAnswerByWordValue(streamed);
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
      setAnswerByParagraphValue(streamed);
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

  const [title, setTitle] = createSignal("");
  const [url, setUrl] = createSignal("");
  const [transcript, setTranscript] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  // https://www.youtube.com/watch?v=eTv3Iax_jVo
  // https://m.youtube.com/watch?v=DzuA9KqTl2w&pp=ygUFSmltbXk%3D
  const youtubeId = createMemo(() => {
    let id = "";
    const u = url().split("?").slice(1).join("");
    if (!u.includes("v")) return "";
    if (u.includes("&")) {
      const vParagraph = u.split("&").at(0);
      if (!vParagraph || !vParagraph.includes("v")) return "";
      id = vParagraph.split("=").at(1) ?? "";
    } else {
      id = u.split("=").at(1) ?? "";
    }
    return id.trim();
  });

  function open() {
    dialogEl()?.showModal();
  }

  function close() {
    dialogEl()?.close();
    setUrl("");
  }

  function save() {
    const dialog = dialogEl();

    if (!dialog) {
      return;
    }

    dialog.close(youtubeId());
  }

  onMount(() => {
    dialogEl()?.addEventListener("close", async () => {
      const dialog = dialogEl();
      if (!dialog || !dialog.returnValue) return;

      if (url().length === 0) return;

      batch(() => {
        setTitle(`https://www.youtube.com/watch?v=${youtubeId()}`);
        setUrl("");
      });

      await transcription(title()).then((r) => {
        batch(() => {
          setLoading(true);
          let transcription = r.transcription.replaceAll("&gt;", ">");
          transcription = transcription.replaceAll("&#39;", "'");

          analyze(transcription).then(async (r) => {
            let answer = "";
            for await (const a of r.stream) {
              answer += a;
              setTranscript(answer);
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

      <Show when={title().length > 0}>
        <div class="saved-link">
          <p>Current source</p>
          <a href={title()} target="_blank" rel="noreferrer">
            {title()}
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
          placeholder="https://youtube.com/watch?v=VIDEO_ID"
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
  const [markdowned, setMarkdowned] = createSignal("");

  createComputed(() => {
    setMarkdowned(marked.parse(s.text) as string);
  });

  return (
    <div
      innerHTML={markdowned()}
      class="prose-block prose prose-invert prose-headings:font-semibold prose-headings:text-inherit prose-h1:text-xl prose-h2:text-lg prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit prose-a:text-sky-300 prose-li:marker:text-amber-400"
    ></div>
  );
};
