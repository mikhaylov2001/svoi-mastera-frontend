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
      import("@/legacy/App.jsx"),
      import("@/legacy/index.css"),
      import("@/legacy/App.css"),
      import("@/legacy/mobile.css"),
      import("@/legacy/styles/unifiedListingCards.css"),
    ]).then(([mod]: any[]) => {
      if (mounted) setApp(() => mod.default);
    }).catch(() => {
      if (mounted) {
        function BootError() {
          return (
            <div style={{
              minHeight: '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              color: '#52525b',
              background: 'radial-gradient(1200px 600px at 80% -10%, rgba(232,65,10,.06), transparent 60%), radial-gradient(900px 500px at -10% 10%, rgba(232,65,10,.04), transparent 55%), #f6f6f4',
            }}>
              Не удалось загрузить приложение. Обновите страницу.
            </div>
          );
        }
        setApp(() => BootError);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!App) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        color: '#71717a',
        background: 'radial-gradient(1200px 600px at 80% -10%, rgba(232,65,10,.06), transparent 60%), radial-gradient(900px 500px at -10% 10%, rgba(232,65,10,.04), transparent 55%), #f6f6f4',
      }}>
        Загрузка…
      </div>
    );
  }
  return <App />;
}
