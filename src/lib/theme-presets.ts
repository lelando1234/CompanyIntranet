export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  headerBg: string;
  headerText: string;
  sidebarBg: string;
  sidebarText: string;
  articleCardBg: string;
  articleCardBorder: string;
  loginBg1: string;
  loginBg2: string;
  loginCardBorder: string;
  loginButtonBg1: string;
  loginButtonBg2: string;
  loginTitleColor1: string;
  loginTitleColor2: string;
}

export const defaultColors: ColorPalette = {
  primary: "#0080ff",
  secondary: "#10b981",
  accent: "#10b981",
  background: "#ffffff",
  foreground: "#001a33",
  headerBg: "#ffffff",
  headerText: "#001a33",
  sidebarBg: "#ffffff",
  sidebarText: "#001a33",
  articleCardBg: "#ffffff",
  articleCardBorder: "#e5e7eb",
  loginBg1: "#eff6ff",
  loginBg2: "#dcfce7",
  loginCardBorder: "#bfdbfe",
  loginButtonBg1: "#2563eb",
  loginButtonBg2: "#16a34a",
  loginTitleColor1: "#2563eb",
  loginTitleColor2: "#16a34a",
};

export const darlingPortalColors: ColorPalette = {
  ...defaultColors,
  primary: "#4a5242",
  secondary: "#7c9885",
  accent: "#b8934d",
  background: "#f5f4ef",
  foreground: "#1c1c1a",
  headerBg: "#4a5242",
  headerText: "#f5f4ef",
  sidebarBg: "#ffffff",
  sidebarText: "#1c1c1a",
  articleCardBg: "#ffffff",
  articleCardBorder: "#e3e1d8",
  loginBg1: "#4a5242",
  loginBg2: "#f5f4ef",
  loginCardBorder: "#e3e1d8",
  loginButtonBg1: "#4a5242",
  loginButtonBg2: "#4a5242",
  loginTitleColor1: "#f5f4ef",
  loginTitleColor2: "#f5f4ef",
};

export const adminColorPresets = [
    { name: "Darling Depot Portal", colors: { ...darlingPortalColors } },
    { name: "Blue & Green (Default)", colors: { ...defaultColors } },
    {
      name: "Purple & Pink",
      colors: {
        ...defaultColors, primary: "#9333ea", secondary: "#ec4899", accent: "#ec4899", foreground: "#1e1b4b",
        headerBg: "#581c87", headerText: "#ffffff", sidebarBg: "#f5f3ff", sidebarText: "#1e1b4b",
        loginBg1: "#f5f3ff", loginBg2: "#fdf2f8", loginCardBorder: "#d8b4fe",
        loginButtonBg1: "#9333ea", loginButtonBg2: "#ec4899", loginTitleColor1: "#9333ea", loginTitleColor2: "#ec4899",
      },
    },
    {
      name: "Orange & Yellow",
      colors: {
        ...defaultColors, primary: "#f97316", secondary: "#eab308", accent: "#eab308", foreground: "#431407",
        headerBg: "#9a3412", headerText: "#ffffff", sidebarBg: "#fff7ed", sidebarText: "#431407",
        loginBg1: "#fff7ed", loginBg2: "#fefce8", loginCardBorder: "#fdba74",
        loginButtonBg1: "#f97316", loginButtonBg2: "#eab308", loginTitleColor1: "#f97316", loginTitleColor2: "#eab308",
      },
    },
    {
      name: "Teal & Cyan",
      colors: {
        ...defaultColors, primary: "#14b8a6", secondary: "#06b6d4", accent: "#06b6d4", foreground: "#042f2e",
        headerBg: "#115e59", headerText: "#ffffff", sidebarBg: "#f0fdfa", sidebarText: "#042f2e",
        loginBg1: "#f0fdfa", loginBg2: "#ecfeff", loginCardBorder: "#5eead4",
        loginButtonBg1: "#14b8a6", loginButtonBg2: "#06b6d4", loginTitleColor1: "#14b8a6", loginTitleColor2: "#06b6d4",
      },
    },
    {
      name: "Dark Professional",
      colors: {
        ...defaultColors, primary: "#3b82f6", secondary: "#6366f1", accent: "#8b5cf6",
        foreground: "#e2e8f0", background: "#0f172a",
        headerBg: "#1e293b", headerText: "#e2e8f0", sidebarBg: "#1e293b", sidebarText: "#e2e8f0",
        articleCardBg: "#1e293b", articleCardBorder: "#334155",
        loginBg1: "#0f172a", loginBg2: "#1e293b", loginCardBorder: "#334155",
        loginButtonBg1: "#3b82f6", loginButtonBg2: "#6366f1", loginTitleColor1: "#60a5fa", loginTitleColor2: "#818cf8",
      },
    },
    {
      name: "Rose & Coral",
      colors: {
        ...defaultColors, primary: "#f43f5e", secondary: "#fb7185", accent: "#ff6b9d", foreground: "#4c0519",
        headerBg: "#9f1239", headerText: "#ffffff", sidebarBg: "#fff1f2", sidebarText: "#4c0519",
        loginBg1: "#fff1f2", loginBg2: "#ffe4e6", loginCardBorder: "#fda4af",
        loginButtonBg1: "#f43f5e", loginButtonBg2: "#fb7185", loginTitleColor1: "#f43f5e", loginTitleColor2: "#fb7185",
      },
    },
    {
      name: "Emerald & Lime",
      colors: {
        ...defaultColors, primary: "#10b981", secondary: "#84cc16", accent: "#84cc16", foreground: "#064e3b",
        headerBg: "#047857", headerText: "#ffffff", sidebarBg: "#ecfdf5", sidebarText: "#064e3b",
        loginBg1: "#ecfdf5", loginBg2: "#f7fee7", loginCardBorder: "#6ee7b7",
        loginButtonBg1: "#10b981", loginButtonBg2: "#84cc16", loginTitleColor1: "#10b981", loginTitleColor2: "#84cc16",
      },
    },
    {
      name: "Indigo & Purple",
      colors: {
        ...defaultColors, primary: "#6366f1", secondary: "#8b5cf6", accent: "#a855f7", foreground: "#312e81",
        headerBg: "#4338ca", headerText: "#ffffff", sidebarBg: "#eef2ff", sidebarText: "#312e81",
        loginBg1: "#eef2ff", loginBg2: "#f5f3ff", loginCardBorder: "#a5b4fc",
        loginButtonBg1: "#6366f1", loginButtonBg2: "#8b5cf6", loginTitleColor1: "#6366f1", loginTitleColor2: "#8b5cf6",
      },
    },
    {
      name: "Amber & Red",
      colors: {
        ...defaultColors, primary: "#f59e0b", secondary: "#ef4444", accent: "#fb923c", foreground: "#451a03",
        headerBg: "#b45309", headerText: "#ffffff", sidebarBg: "#fffbeb", sidebarText: "#451a03",
        loginBg1: "#fffbeb", loginBg2: "#fef2f2", loginCardBorder: "#fcd34d",
        loginButtonBg1: "#f59e0b", loginButtonBg2: "#ef4444", loginTitleColor1: "#f59e0b", loginTitleColor2: "#ef4444",
      },
    },
    {
      name: "Sky & Blue",
      colors: {
        ...defaultColors, primary: "#0ea5e9", secondary: "#3b82f6", accent: "#60a5fa", foreground: "#0c4a6e",
        headerBg: "#0369a1", headerText: "#ffffff", sidebarBg: "#f0f9ff", sidebarText: "#0c4a6e",
        loginBg1: "#f0f9ff", loginBg2: "#eff6ff", loginCardBorder: "#7dd3fc",
        loginButtonBg1: "#0ea5e9", loginButtonBg2: "#3b82f6", loginTitleColor1: "#0ea5e9", loginTitleColor2: "#3b82f6",
      },
    },
    {
      name: "Slate & Gray",
      colors: {
        ...defaultColors, primary: "#475569", secondary: "#64748b", accent: "#94a3b8",
        foreground: "#e2e8f0", background: "#1e293b",
        headerBg: "#334155", headerText: "#f1f5f9", sidebarBg: "#334155", sidebarText: "#f1f5f9",
        articleCardBg: "#334155", articleCardBorder: "#475569",
        loginBg1: "#1e293b", loginBg2: "#334155", loginCardBorder: "#475569",
        loginButtonBg1: "#475569", loginButtonBg2: "#64748b", loginTitleColor1: "#94a3b8", loginTitleColor2: "#cbd5e1",
      },
    },
    {
      name: "Violet & Fuchsia",
      colors: {
        ...defaultColors, primary: "#7c3aed", secondary: "#d946ef", accent: "#e879f9", foreground: "#3b0764",
        headerBg: "#6b21a8", headerText: "#ffffff", sidebarBg: "#faf5ff", sidebarText: "#3b0764",
        loginBg1: "#faf5ff", loginBg2: "#fdf4ff", loginCardBorder: "#c084fc",
        loginButtonBg1: "#7c3aed", loginButtonBg2: "#d946ef", loginTitleColor1: "#7c3aed", loginTitleColor2: "#d946ef",
      },
    },
    {
      name: "Mint & Seafoam",
      colors: {
        ...defaultColors, primary: "#2dd4bf", secondary: "#5eead4", accent: "#14b8a6", foreground: "#134e4a",
        headerBg: "#0f766e", headerText: "#ffffff", sidebarBg: "#f0fdfa", sidebarText: "#134e4a",
        loginBg1: "#f0fdfa", loginBg2: "#ccfbf1", loginCardBorder: "#5eead4",
        loginButtonBg1: "#2dd4bf", loginButtonBg2: "#5eead4", loginTitleColor1: "#2dd4bf", loginTitleColor2: "#14b8a6",
      },
    },
  ];

export const profileDefaultColors = {
  primary: "#0080ff",
  secondary: "#10b981",
  accent: "#10b981",
  background: "#ffffff",
  foreground: "#001a33",
  headerBg: "#ffffff",
  headerText: "#001a33",
  sidebarBg: "#ffffff",
  sidebarText: "#001a33",
};

export const userColorPresets = [
  { 
    name: "Blue & Green (Default)", 
    colors: { ...profileDefaultColors } 
  },
  {
    name: "Purple & Pink",
    colors: {
      primary: "#9333ea",
      secondary: "#ec4899",
      accent: "#ec4899",
      background: "#ffffff",
      foreground: "#1e1b4b",
      headerBg: "#581c87",
      headerText: "#ffffff",
      sidebarBg: "#f5f3ff",
      sidebarText: "#1e1b4b",
    },
  },
  {
    name: "Orange & Yellow",
    colors: {
      primary: "#f97316",
      secondary: "#eab308",
      accent: "#eab308",
      background: "#ffffff",
      foreground: "#431407",
      headerBg: "#9a3412",
      headerText: "#ffffff",
      sidebarBg: "#fff7ed",
      sidebarText: "#431407",
    },
  },
  {
    name: "Teal & Cyan",
    colors: {
      primary: "#14b8a6",
      secondary: "#06b6d4",
      accent: "#06b6d4",
      background: "#ffffff",
      foreground: "#042f2e",
      headerBg: "#115e59",
      headerText: "#ffffff",
      sidebarBg: "#f0fdfa",
      sidebarText: "#042f2e",
    },
  },
  {
    name: "Dark Professional",
    colors: {
      primary: "#3b82f6",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      foreground: "#e2e8f0",
      background: "#0f172a",
      headerBg: "#1e293b",
      headerText: "#e2e8f0",
      sidebarBg: "#1e293b",
      sidebarText: "#e2e8f0",
    },
  },
  {
    name: "Rose & Coral",
    colors: {
      primary: "#f43f5e",
      secondary: "#fb7185",
      accent: "#ff6b9d",
      background: "#ffffff",
      foreground: "#4c0519",
      headerBg: "#9f1239",
      headerText: "#ffffff",
      sidebarBg: "#fff1f2",
      sidebarText: "#4c0519",
    },
  },
  {
    name: "Emerald & Lime",
    colors: {
      primary: "#10b981",
      secondary: "#84cc16",
      accent: "#84cc16",
      background: "#ffffff",
      foreground: "#064e3b",
      headerBg: "#047857",
      headerText: "#ffffff",
      sidebarBg: "#ecfdf5",
      sidebarText: "#064e3b",
    },
  },
  {
    name: "Indigo & Purple",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#a855f7",
      background: "#ffffff",
      foreground: "#312e81",
      headerBg: "#4338ca",
      headerText: "#ffffff",
      sidebarBg: "#eef2ff",
      sidebarText: "#312e81",
    },
  },
  {
    name: "Amber & Red",
    colors: {
      primary: "#f59e0b",
      secondary: "#ef4444",
      accent: "#fb923c",
      background: "#ffffff",
      foreground: "#451a03",
      headerBg: "#b45309",
      headerText: "#ffffff",
      sidebarBg: "#fffbeb",
      sidebarText: "#451a03",
    },
  },
  {
    name: "Sky & Blue",
    colors: {
      primary: "#0ea5e9",
      secondary: "#3b82f6",
      accent: "#60a5fa",
      background: "#ffffff",
      foreground: "#0c4a6e",
      headerBg: "#0369a1",
      headerText: "#ffffff",
      sidebarBg: "#f0f9ff",
      sidebarText: "#0c4a6e",
    },
  },
  {
    name: "Slate & Gray",
    colors: {
      primary: "#475569",
      secondary: "#64748b",
      accent: "#94a3b8",
      foreground: "#e2e8f0",
      background: "#1e293b",
      headerBg: "#334155",
      headerText: "#f1f5f9",
      sidebarBg: "#334155",
      sidebarText: "#f1f5f9",
    },
  },
  {
    name: "Violet & Fuchsia",
    colors: {
      primary: "#7c3aed",
      secondary: "#d946ef",
      accent: "#e879f9",
      background: "#ffffff",
      foreground: "#3b0764",
      headerBg: "#6b21a8",
      headerText: "#ffffff",
      sidebarBg: "#faf5ff",
      sidebarText: "#3b0764",
    },
  },
];