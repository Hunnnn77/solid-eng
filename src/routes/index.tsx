import "./index.css";
import { Title } from "@solidjs/meta";
import { useAction } from "@solidjs/router";
import {
  batch,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  splitProps,
  Switch,
  type Component,
} from "solid-js";
import { Input } from "~/components/Input";
import type { TAction } from "~/types";
import { parse } from "marked";
import { Button } from "~/components/Button";
import { analyzeAction, paragraphAction, transcriptionAction, wordAction } from "~/actions";
import { getYoutubeUrl } from "~/utils";
import { Portal } from "solid-js/web";
import {
  HistoryKey,
  useHistoryContext,
  type IHistoryStorage,
  type IHistory,
} from "~/components/HistoriesProvider";

export default function Home() {
  const transcription = useAction(transcriptionAction);
  const analyze = useAction(analyzeAction);
  const word = useAction(wordAction);
  const paragraph = useAction(paragraphAction);

  return (
    <div class="app-shell">
      <Title>English Studio</Title>
      <main class="main-pane">
        <Header />
        <div class="tool-grid">
          <div class="left-section">
            <WordSearcher word={word} />
            <ParagraphWriting paragraph={paragraph} />
          </div>

          <YoutubeComponent transcription={transcription} analyze={analyze} />
        </div>
      </main>
    </div>
  );
}

const Header: Component = () => {
  const historyCtx = useHistoryContext();
  const [historyDialog, setHistoryDialog] = createSignal<HTMLDialogElement>();
  const [historyOpen, setHistoryOpen] = createSignal(false);
  const [catched, setCatched] = createSignal<IHistory | undefined>();
  const lenOfHistory = createMemo(() => historyCtx.histories().length);

  function openDialog() {
    if (historyDialog() && historyDialog()?.isConnected) {
      historyDialog()?.showModal();
    }
  }

  function closeDialog() {
    if (historyDialog() && historyDialog()?.isConnected) {
      historyDialog()?.close();
    }
  }

  function whenClickWord(history: IHistory) {
    closeDialog();
    batch(() => {
      setHistoryOpen(true);
      setCatched(history);
    });
  }

  createEffect(() => {
    if (lenOfHistory() === 0) {
      closeDialog();
    }

    if (lenOfHistory() >= 0) {
      localStorage.setItem(
        HistoryKey,
        JSON.stringify({
          histories: historyCtx.histories(),
        } satisfies IHistoryStorage),
      );
    }
  });

  onMount(() => {
    if (historyDialog() && historyDialog()?.isConnected) {
      globalThis.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "F1":
            e.preventDefault();
            if (lenOfHistory() === 0) {
              break;
            }

            if (historyDialog()?.open) {
              closeDialog();
            } else {
              openDialog();
            }
            break;
        }
      });
    }
  });

  return (
    <header class="hero-card panel-surface panel-border panel-shadow">
      <div class="header-row">
        <div>
          <p class="eyebrow">Writing companion</p>
          <h1 class="hero-title hero-title--spaced">English Studio</h1>
        </div>

        <div class="header-actions">
          <Button buttonType="history" callback={() => lenOfHistory() > 0 && openDialog()}></Button>
        </div>
      </div>

      <dialog class="app-dialog panel-surface panel-border" ref={setHistoryDialog}>
        <div class="dialog-content">
          <Show when={lenOfHistory() > 0}>
            <div class="flex items-center justify-between mb-6">
              <h2 class="secondary-head secondary-head--capitalize">history</h2>
              <Button buttonType="close" callback={closeDialog}></Button>
            </div>
            <div class="history-list">
              <For each={historyCtx.histories()}>
                {(h, i) => (
                  <div class="flex items-center space-x-1.5">
                    <button class="chip" onclick={() => whenClickWord(h)}>
                      {h.text}
                    </button>
                    <button onclick={() => historyCtx.delItemFromHistory(i())}>x</button>
                  </div>
                )}
              </For>

              <Show when={historyOpen()}>
                <Portal mount={document.querySelector("body")!}>
                  <div class="absolute top-0 left-0 z-10 opacity-40 bg-black w-full h-full"></div>
                  <div class="app-dialog panel-surface panel-border z-20">
                    <Show
                      when={catched()}
                      fallback={
                        <div class="history-preview-empty">
                          <h1 class="hero-title history-preview-empty-title">
                            no content available
                          </h1>
                          <Button
                            class="history-preview-empty-close"
                            callback={() => setHistoryOpen(false)}
                            buttonType="back"
                          ></Button>
                        </div>
                      }
                    >
                      <div>
                        <div class="flex justify-between items-center mb-6">
                          <h1 class="hero-title capitalize">{catched()?.text}</h1>
                          <div class="flex space-x-2">
                            <Button
                              buttonType="back"
                              callback={() => {
                                setHistoryOpen(false);
                                openDialog();
                              }}
                            ></Button>
                            <Button
                              buttonType="close"
                              callback={() => setHistoryOpen(false)}
                            ></Button>
                          </div>
                        </div>
                        <Prose text={catched()?.answer ?? ""}></Prose>
                      </div>
                    </Show>
                  </div>
                </Portal>
              </Show>
            </div>
          </Show>
        </div>
      </dialog>
    </header>
  );
};

const WordSearcher: Component<{
  word: TAction<string, typeof wordAction>;
}> = ({ word: w }) => {
  const historyCtx = useHistoryContext();
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
      historyCtx.setHistory({
        answer: parse(streamed) as string,
        text: query,
      });

      setWordValue("");
      setDisabled(false);
    });
  }

  return (
    <section class="tool-card panel-surface panel-border panel-shadow">
      <p class="eyebrow">Word Explorer</p>

      <div class="tool-head flex">
        <h2>Search a word</h2>
        <Button buttonType="search" disabled={disabled()} callback={collectWordStream} />
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
      <p class="eyebrow">Draft Doctor</p>
      <div class="tool-head flex">
        <h2>Polish a paragraph</h2>
        <Button buttonType="search" disabled={disabled()} callback={collectParagraphStream} />
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
  const [error, setError] = createSignal<string | undefined>();
  const [loading, setLoading] = createSignal(false);

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

    if (!dialog) return;

    if (!url().includes("youtube") && !url().includes("v")) {
      dialog?.close();
      setUrl("");
      return;
    }

    dialog.close(youtubeId());
  }

  const clean = () =>
    batch(() => {
      setUrl("");
      setLoading(false);
    });

  onMount(() => {
    dialogEl()?.addEventListener("close", async () => {
      const dialog = dialogEl();
      if (!dialog || !dialog.returnValue) return;
      if (url().length === 0) return;

      batch(() => {
        setTitle(getYoutubeUrl(youtubeId()));
        setLoading(true);
      });

      const fetchTranscript = await transcription(youtubeId());

      if (typeof fetchTranscript === "object" && "ok" in fetchTranscript) {
        if (fetchTranscript.ok) {
          const { stream } = await analyze(fetchTranscript.message);
          let answer = "";
          for await (const a of stream) {
            answer += a;
            setTranscript(answer);
          }
        } else {
          setError(fetchTranscript.message);
        }
      } else {
        setError("Invalid fetchTranscript");
      }

      clean();
    });
  });

  return (
    <aside class="side-pane panel-surface panel-border panel-shadow">
      <p class="eyebrow">Utility</p>
      <div class="flex justify-between">
        <h2>Transcript</h2>
        <Button buttonType="youtube" disabled={loading()} callback={open}></Button>
      </div>

      <p class="side-copy">
        Save a YouTube URL here and keep your transcript source visible while writing.
      </p>

      <Show when={title().length > 0}>
        <div class="saved-link">
          <p>Current source</p>
          <a href={title()} target="_blank" rel="noreferrer">
            {title()}
          </a>
        </div>
      </Show>

      <Switch>
        <Match when={error() ?? "".length > 0}>
          <Prose text={error() ?? ""}></Prose>
        </Match>
        <Match when={transcript().length > 0}>
          <Prose text={transcript()}></Prose>
        </Match>
      </Switch>

      <dialog class="app-dialog panel-surface panel-border" ref={setDialogEl}>
        <h3>Video URL</h3>
        <input
          class="input-field mb-2"
          value={url()}
          type="url"
          placeholder="https://youtube.com/watch?v=VIDEO_ID"
          oninput={(e) => setUrl(e.target.value)}
        />
        <div class="dialog-actions space-x-2">
          <Button buttonType="close" callback={close}></Button>
          <Button buttonType="save" callback={save}></Button>
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
    setMarkdowned(parse(s.text) as string);
  });

  return (
    <div
      innerHTML={markdowned()}
      class="prose-block prose prose-invert prose-headings:font-semibold prose-headings:text-inherit prose-h1:text-xl prose-h2:text-lg prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit prose-a:text-sky-300 prose-li:marker:text-amber-400"
    ></div>
  );
};
