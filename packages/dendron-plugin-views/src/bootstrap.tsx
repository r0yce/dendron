import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import DendronApp, { DendronAppProps } from "./components/DendronApp";
import { DendronComponent } from "./types";

function renderWithDendronApp(props: DendronAppProps) {
  return <DendronApp {...props} />;
}

/**
 * Render standalone react app
 * @param opts.padding: override default padding
 */
export function renderOnDOM(
  Component: DendronComponent,
  opts: DendronAppProps["opts"]
) {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Dendron webview root element (#root) was not found");
  }

  // React 19 removed ReactDOM.render; createRoot is required to mount webviews.
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      {renderWithDendronApp({ Component, opts })}
    </React.StrictMode>
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}
