import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { HistoriesProvider } from "./components/HistoriesProvider";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>App</Title>
          <HistoriesProvider>
            <Suspense>{props.children}</Suspense>
          </HistoriesProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
