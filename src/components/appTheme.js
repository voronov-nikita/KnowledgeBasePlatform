export const lightTheme = {
    background: "#f3f5f7",
    surface: "#ffffff",
    surfaceSecondary: "#f8fafc",
    card: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#64748b",
    primary: "#2f80ed",
    primarySoft: "#eaf2ff",
    inputBackground: "#ffffff",
    inputBorder: "#d7dee7",
    modalOverlay: "rgba(15, 23, 42, 0.24)",
    success: "#14b8a6",
    purple: "#7c3aed",
    warning: "#f59e0b",
};

export const darkTheme = {
    background: "#0b1220",
    surface: "#111827",
    surfaceSecondary: "#0f172a",
    card: "#111827",
    border: "#243041",
    text: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    primary: "#3b82f6",
    primarySoft: "#172554",
    inputBackground: "#0f172a",
    inputBorder: "#334155",
    modalOverlay: "rgba(0, 0, 0, 0.55)",
    success: "#14b8a6",
    purple: "#8b5cf6",
    warning: "#f59e0b",
};

export function getAppTheme(mode) {
    return mode === "light" ? lightTheme : darkTheme;
}
