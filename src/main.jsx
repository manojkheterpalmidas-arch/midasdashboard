import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

function BootError({ error }) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#172033" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>MIDAS app could not start</h1>
      <p style={{ marginBottom: 16 }}>The browser reported this error while loading the app:</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#111827", color: "#f8fafc", padding: 16, borderRadius: 8 }}>
        {String(error?.stack || error?.message || error)}
      </pre>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) return <BootError error={this.state.error} />;
    return this.props.children;
  }
}

// Register the PWA service worker in production builds only (it would interfere
// with Vite's dev hot-reload). This is what makes the app installable.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

try {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  createRoot(document.getElementById("root")).render(<BootError error={error} />);
}
