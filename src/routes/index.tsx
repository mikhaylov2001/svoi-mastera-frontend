import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LegacyAppIndex,
});

function LegacyAppIndex() {
  const [App, setApp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      // @ts-expect-error legacy JS without types
      import("@/legacy/App.js"),
      import("@/legacy/index.css"),
      import("@/legacy/App.css"),
      import("@/legacy/mobile.css"),
      import("@/legacy/styles/unifiedListingCards.css"),
    ]).then(([mod]: any[]) => {
      if (mounted) setApp(() => mod.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!App) return <div style={{ minHeight: "100vh" }} />;
  return <App />;
}
