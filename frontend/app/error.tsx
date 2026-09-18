"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F5F0" }}>
      <div style={{ textAlign: "center", maxWidth: 380, padding: 24 }}>
        <AlertTriangle size={28} color="#B3411E" style={{ marginBottom: 14 }} />
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 8 }}>Something didn&rsquo;t load</h2>
        <p style={{ color: "#55524A", fontSize: 14, marginBottom: 20 }}>
          The page hit an unexpected error. Try again, or go back to the console.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{ padding: "9px 16px", background: "#1C1B18", color: "#F7F5F0", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{ padding: "9px 16px", border: "1px solid #1C1B18", borderRadius: 4, fontWeight: 600 }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
