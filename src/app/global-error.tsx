"use client";

import { useEffect } from "react";

/** Root error UI — never expose infrastructure details. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#f6f4fb",
          color: "#2e246b",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#2a3f55",
              }}
            >
              503
            </p>
            <h1
              style={{
                margin: "12px 0 0",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Service unavailable
            </h1>
            <p style={{ margin: "16px 0 0", color: "#2a3f55", lineHeight: 1.5 }}>
              We’re temporarily unable to load this page. Please try again in a
              moment.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 28,
                border: 0,
                background: "#f15a3a",
                color: "#ffffff",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
