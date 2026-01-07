import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    muted: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingSizes: {
      h1: string;
      h2: string;
      h3: string;
      h4: string;
    };
    bodySize: string;
    lineHeight: string;
  };
  branding: {
    logo: string;
    favicon: string;
    businessName: string;
    tagline: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  layout: {
    borderRadius: "sharp" | "rounded" | "very-rounded";
    shadowIntensity: "none" | "subtle" | "medium" | "strong";
    maxWidth: string;
  };
}

const defaultTheme: ThemeConfig = {
  colors: {
    primary: "18 85% 62%",
    secondary: "32 30% 92%",
    accent: "330 45% 45%",
    background: "28 25% 97%",
    foreground: "24 15% 15%",
    card: "0 0% 100%",
    muted: "32 20% 88%",
    border: "32 20% 88%",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    headingSizes: {
      h1: "3rem",
      h2: "2.25rem",
      h3: "1.875rem",
      h4: "1.5rem",
    },
    bodySize: "1rem",
    lineHeight: "1.6",
  },
  branding: {
    logo: "",
    favicon: "",
    businessName: "Mango Beauty & Wellness",
    tagline: "Your sanctuary for beauty and relaxation",
    contactEmail: "hello@mangobeauty.com",
    contactPhone: "(555) 123-4567",
    address: "123 Beauty Lane, Wellness City, CA 90210",
  },
  layout: {
    borderRadius: "rounded",
    shadowIntensity: "medium",
    maxWidth: "1400px",
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  isDraft: boolean;
  publishTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("mango-theme-draft");
    return saved ? JSON.parse(saved) : defaultTheme;
  });
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    localStorage.setItem("mango-theme-draft", JSON.stringify(theme));
    setIsDraft(true);
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme((prev) => ({
      ...prev,
      ...updates,
      colors: { ...prev.colors, ...updates.colors },
      typography: { ...prev.typography, ...updates.typography },
      branding: { ...prev.branding, ...updates.branding },
      layout: { ...prev.layout, ...updates.layout },
    }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setIsDraft(false);
  };

  const publishTheme = () => {
    localStorage.setItem("mango-theme-published", JSON.stringify(theme));
    setIsDraft(false);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, isDraft, publishTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
