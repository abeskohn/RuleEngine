import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Make sure your HTML contains a <div id='root'></div>"
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(

    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

reportWebVitals();
