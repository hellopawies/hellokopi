"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (typeof console !== "undefined") console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#FAFAF8", color: "#1C1917", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: "24rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontWeight: 300, fontSize: "1.875rem", marginBottom: "0.75rem" }}>
            Something cracked.
          </h1>
          <p style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontWeight: 300, fontStyle: "italic", color: "#A8A29E", marginBottom: "2rem" }}>
            The kettle slipped — try again?
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.875rem 2.5rem", borderRadius: "0.75rem", border: "1px solid #292524", backgroundColor: "transparent", color: "#292524", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
