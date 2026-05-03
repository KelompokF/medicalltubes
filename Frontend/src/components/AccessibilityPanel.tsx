import { useState } from "react";
import { createPortal } from "react-dom";
import { Type, X, Check } from "lucide-react";
import { useAccessibility, ColorBlindMode } from "@/contexts/AccessibilityContext";

const COLOR_BLIND_OPTIONS: { value: ColorBlindMode; label: string; desc: string; swatch: string }[] = [
  {
    value: "none",
    label: "Normal",
    desc: "Tampilan standar",
    swatch: "bg-gradient-to-br from-red-400 via-green-400 to-blue-400",
  },
  {
    value: "protanopia",
    label: "Protanopia",
    desc: "Buta merah",
    swatch: "bg-gradient-to-br from-yellow-400 via-yellow-300 to-blue-400",
  },
  {
    value: "deuteranopia",
    label: "Deuteranopia",
    desc: "Buta hijau",
    swatch: "bg-gradient-to-br from-amber-400 via-amber-300 to-blue-500",
  },
  {
    value: "tritanopia",
    label: "Tritanopia",
    desc: "Buta biru",
    swatch: "bg-gradient-to-br from-red-400 via-pink-400 to-teal-400",
  },
];

export default function AccessibilityPanel() {
  const { colorBlindMode, largeText, setColorBlindMode, toggleLargeText } =
    useAccessibility();
  const [open, setOpen] = useState(false);

  const isActive = colorBlindMode !== "none" || largeText;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {/* ── Panel (opens upward) ── */}
      {open && (
        <div
          className="bg-card border border-border rounded-2xl shadow-elevated w-72 overflow-hidden"
          style={{ animation: "fadeSlideUp 0.18s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary fill-current" aria-hidden="true">
                <circle cx="12" cy="4" r="2" />
                <path d="M12 7c-2.76 0-5 2.24-5 5v1h2v-1c0-1.65 1.35-3 3-3s3 1.35 3 3v1h2v-1c0-2.76-2.24-5-5-5z" />
                <path d="M7.5 13H9v7h6v-7h1.5l1-3H6.5l1 3z" />
              </svg>
              Aksesibilitas
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Tutup"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Large Text toggle */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Teks Besar</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Perbesar ukuran huruf
                  </p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={largeText}
                onClick={toggleLargeText}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                  border-2 border-transparent transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${largeText ? "bg-primary" : "bg-muted"}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white
                    shadow-lg ring-0 transition-transform duration-200
                    ${largeText ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          </div>

          {/* Color Blind Mode */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Mode Buta Warna
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_BLIND_OPTIONS.map((opt) => {
                const selected = colorBlindMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setColorBlindMode(opt.value)}
                    aria-pressed={selected}
                    className={`
                      flex items-center gap-2 rounded-xl px-2.5 py-2 text-left
                      border transition-all duration-150
                      ${selected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background hover:bg-muted/50 hover:border-primary/40"
                      }
                    `}
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-full ${opt.swatch} flex items-center justify-center`}>
                      {selected && <Check className="h-3 w-3 text-white drop-shadow" />}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className={`text-xs font-medium leading-snug truncate ${selected ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-tight">
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active badges */}
          {isActive && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {colorBlindMode !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                  ✓ {COLOR_BLIND_OPTIONS.find((o) => o.value === colorBlindMode)?.label}
                </span>
              )}
              {largeText && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                  ✓ Teks Besar
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FAB — circle button ── */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? "Tutup aksesibilitas" : "Buka aksesibilitas"}
        className={`
          relative h-14 w-14 rounded-full shadow-elevated
          flex items-center justify-center
          transition-all duration-200 hover:scale-110 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          bg-primary text-primary-foreground
          ${isActive ? "ring-2 ring-primary ring-offset-2" : ""}
          ${open ? "" : "animate-float"}
        `}
      >
        {/* Dot indicator when active */}
        {isActive && !open && (
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-amber-400 border-2 border-white animate-pulse" />
        )}

        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
            <circle cx="12" cy="4" r="2" />
            <path d="M12 7c-2.76 0-5 2.24-5 5v1h2v-1c0-1.65 1.35-3 3-3s3 1.35 3 3v1h2v-1c0-2.76-2.24-5-5-5z" />
            <path d="M7.5 13H9v7h6v-7h1.5l1-3H6.5l1 3z" />
          </svg>
        )}
      </button>
    </div>,
    document.body
  );
}
