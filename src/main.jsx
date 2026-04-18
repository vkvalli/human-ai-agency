import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { TrackingProvider } from "./context/TrackingContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TrackingProvider>
      <App />
    </TrackingProvider>
  </React.StrictMode>
);