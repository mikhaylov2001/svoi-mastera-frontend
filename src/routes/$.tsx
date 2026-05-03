import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$")({
  component: LegacyApp,
});

function LegacyApp() {
  const [App, setApp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    // Lazy-load on client only — legacy app uses BrowserRouter, localStorage, etc.
    Promise.all([
      import("@/legacy/App.jsx"),
      import("@/legacy/index.css"),
      import("@/legacy/App.css"),
      import("@/legacy/mobile.css"),
      import("@/legacy/styles/unifiedListingCards.css"),
    ]).then(([mod]) => {
      if (mounted) setApp(() => mod.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!App) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Загрузка…
      </div>
    );
  }

  return <App />;
}
