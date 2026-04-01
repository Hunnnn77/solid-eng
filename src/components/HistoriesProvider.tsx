import {
  createContext,
  createSignal,
  useContext,
  type Accessor,
  type Component,
  type JSXElement,
} from "solid-js";

interface IHistory {
  text: string;
  answer: string;
}
const HistoriesContext = createContext<{
  histories: Accessor<IHistory[]>;
  setHistory: (history: IHistory) => void;
}>();

const HistoriesProvider: Component<{
  children: JSXElement;
}> = (props) => {
  const [histories, setHistories] = createSignal<IHistory[]>([]);

  return (
    <HistoriesContext.Provider
      value={{
        histories,
        setHistory: (h) => setHistories((his) => [...his, h]),
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

export { type IHistory, HistoriesProvider, useHistoryContext };
