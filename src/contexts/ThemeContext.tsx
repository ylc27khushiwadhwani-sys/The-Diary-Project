import React, { createContext, useContext, useEffect } from "react";

/**
 * The library has two lights: the original candlelit dark, and a sunlit
 * garden reading room (light). The choice persists on the device and is
 * applied as the `light` class on <html>, which index.css keys off.
 */

type Theme = "dark" | "light";

const STORAGE_KEY = "tpv-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "dark",
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme: Theme = "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode: the choice simply doesn't persist */
    }
  }, [theme]);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
