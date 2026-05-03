import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";

interface AccessibilityState {
  colorBlindMode: ColorBlindMode;
  largeText: boolean;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  toggleLargeText: () => void;
}

const AccessibilityContext = createContext<AccessibilityState | null>(null);

const STORAGE_KEY_COLOR = "a11y_color_blind";
const STORAGE_KEY_TEXT  = "a11y_large_text";

// ─── Inject hidden SVG filter defs into <body> once ───────────────────
// Referencing by #id is far more reliable than data-URI approaches.
const SVG_FILTER_ID = "a11y-svg-filters";

const COLOR_MATRIX: Record<string, string> = {
  protanopia:
    "0.152 1.053 -0.205 0 0  " +
    "0.115 0.786  0.099 0 0  " +
    "0     0.040  0.960 0 0  " +
    "0     0      0     1 0",
  deuteranopia:
    "0.367 0.861 -0.228 0 0  " +
    "0.280 0.673  0.047 0 0  " +
    "0     0.040  0.960 0 0  " +
    "0     0      0     1 0",
  tritanopia:
    "1.256 -0.077 -0.179 0 0  " +
    "0      0.926  0.074 0 0  " +
    "0      0.601  0.399 0 0  " +
    "0      0      0     1 0",
};

function injectSVGFilters() {
  if (document.getElementById(SVG_FILTER_ID)) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = SVG_FILTER_ID;
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  Object.entries(COLOR_MATRIX).forEach(([name, values]) => {
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.id = `cb-${name}`;
    filter.setAttribute("color-interpolation-filters", "linearRGB");

    const matrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
    matrix.setAttribute("type", "matrix");
    matrix.setAttribute("values", values);

    filter.appendChild(matrix);
    defs.appendChild(filter);
  });

  svg.appendChild(defs);
  document.body.appendChild(svg);
}

// ──────────────────────────────────────────────────────────────────────

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(
    () => (localStorage.getItem(STORAGE_KEY_COLOR) as ColorBlindMode) || "none"
  );
  const [largeText, setLargeText] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY_TEXT) === "true"
  );

  // Inject SVG filter defs once on mount
  useEffect(() => {
    injectSVGFilters();
  }, []);

  // Apply classes to <html> → CSS will reference the injected SVG filters
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("cb-protanopia", "cb-deuteranopia", "cb-tritanopia");
    if (colorBlindMode !== "none") {
      html.classList.add(`cb-${colorBlindMode}`);
    }
    localStorage.setItem(STORAGE_KEY_COLOR, colorBlindMode);
  }, [colorBlindMode]);

  useEffect(() => {
    const html = document.documentElement;
    if (largeText) {
      html.classList.add("a11y-large-text");
    } else {
      html.classList.remove("a11y-large-text");
    }
    localStorage.setItem(STORAGE_KEY_TEXT, String(largeText));
  }, [largeText]);

  const setColorBlindMode = (mode: ColorBlindMode) => setColorBlindModeState(mode);
  const toggleLargeText   = () => setLargeText((p) => !p);

  return (
    <AccessibilityContext.Provider
      value={{ colorBlindMode, largeText, setColorBlindMode, toggleLargeText }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}
