import Link from "next/link";
import { FileStack } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F5F0" }}>
      <div style={{ textAlign: "center", maxWidth: 380, padding: 24 }}>
        <FileStack size={28} color="#B8B2A0" style={{ marginBottom: 14 }} />
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginBottom: 8 }}>No record on file</h2>
        <p style={{ color: "#55524A", fontSize: 14, marginBottom: 20 }}>
          Nothing is filed at this address. Head back to the console.
        </p>
        <Link
          href="/"
          style={{ padding: "9px 16px", background: "#1C1B18", color: "#F7F5F0", borderRadius: 4, fontWeight: 600 }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
