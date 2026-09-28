import { useState } from "react";
import { getSupabaseModeStatus } from "../../lib/supabase/config";

export function DataModeNotice() {
  const [dismissed, setDismissed] = useState(false);
  const status = getSupabaseModeStatus();

  if (!status.warning || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        background: "var(--color-warning-bg, #fff8e7)",
        color: "var(--color-warning-text, #775712)",
        borderBottom: "1px solid var(--color-warning-border, #f0d795)",
        padding: "0.5rem 1rem",
        fontSize: "0.8125rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        zIndex: 9999,
        position: "relative",
      }}
    >
      <div>
        <strong>Mode Data:</strong> {status.warning}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          fontSize: "1rem",
          padding: "0 0.25rem",
        }}
        aria-label="Tutup pemberitahuan"
      >
        ×
      </button>
    </div>
  );
}
