import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./shell/Router";
import { AuthProvider } from "./shared/contexts/AuthContext";
import { ToastProvider } from "./shared/contexts/ToastContext";
import { ToastContainer } from "./shared/components/ToastContainer";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { initSentry } from "./shared/lib/sentry";
import "./shared/styles/tokens.css";
import "./shared/styles/global.css";

initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRouter />
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
