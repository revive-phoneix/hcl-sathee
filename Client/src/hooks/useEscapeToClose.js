import { useEffect } from "react";

export function useEscapeToClose(onClose, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof onClose !== "function") return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, enabled]);
}
