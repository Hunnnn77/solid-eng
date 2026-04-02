import {
  createContext,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type Component,
  type JSXElement,
} from "solid-js";

interface IHistoryStorage {
  histories: IHistory[];
}
interface IHistory {
  text: string;
  answer: string;
}

const HistoryKey = "histories";
const HistoriesContext = createContext<{
  histories: Accessor<IHistory[]>;
  setHistory: (history: IHistory) => void;
  delItemFromHistory: (index: number) => void;
}>();

const HistoriesProvider: Component<{
  children: JSXElement;
}> = (props) => {
  const [histories, setHistories] = createSignal<IHistory[]>([]);

  onMount(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(HistoryKey) ?? "") as IHistoryStorage;
      setHistories(parsed.histories);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setHistories([]);
        localStorage.clear();
      }
    }
  });

  return (
    <HistoriesContext.Provider
      value={{
        histories,
        setHistory: (h) => setHistories((his) => [...his, h]),
        delItemFromHistory: (i) => setHistories((his) => his.filter((_, index) => index !== i)),
      }}
    >
      {props.children}
    </HistoriesContext.Provider>
  );
};

const useHistoryContext = () => {
  const ctx = useContext(HistoriesContext);
  if (!ctx) throw new Error("no historyContext");
  return ctx;
};

export { type IHistory, type IHistoryStorage, HistoriesProvider, useHistoryContext, HistoryKey };
