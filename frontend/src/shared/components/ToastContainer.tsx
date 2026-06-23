import { useToastContext } from "../contexts/ToastContext";

const variantStyle: Record<string, React.CSSProperties> = {
  success: { borderColor: "#00ff00", color: "#00ff00" },
  error: { borderColor: "#ff4444", color: "#ff4444" },
  info: { borderColor: "#ffffff", color: "#ffffff" },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 100,
        display: "grid",
        gap: "0.5rem",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            border: "1px solid",
            ...variantStyle[toast.variant],
            background: "#000",
            padding: "0.75rem 1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            cursor: "pointer",
            minWidth: "220px",
          }}
          onClick={() => removeToast(toast.id)}
          role="button"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
