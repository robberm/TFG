import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const DarkModeContext = createContext();

const THEME_CLASSES = ["light", "dark", "translucent"];

const getStoredTheme = () => {
  const translucentMode = localStorage.getItem("translucentMode") === "true";
  const darkMode = localStorage.getItem("darkMode") === "true";

  if (translucentMode) return "translucent";
  if (darkMode) return "dark";
  return "light";
};

const applyThemeToBody = (theme) => {
  document.body.classList.remove(...THEME_CLASSES);
  document.body.classList.add(theme);
};

const getCurrentRoute = () => {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const DarkModeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyThemeToBody(theme);
    localStorage.setItem("darkMode", String(theme === "dark"));
    localStorage.setItem("translucentMode", String(theme === "translucent"));
  }, [theme]);

  const switchTheme = (nextTheme) => {
    const wasTransparent = theme === "translucent";
    const willBeTransparent = nextTheme === "translucent";

    setTheme(nextTheme);

    if (
      window.electronAPI?.setWindowTransparencyMode &&
      wasTransparent !== willBeTransparent
    ) {
      window.electronAPI.setWindowTransparencyMode({
        transparent: willBeTransparent,
        route: getCurrentRoute(),
      });
    }
  };

  const toggleDarkMode = () => {
    if (theme === "dark") {
      switchTheme("light");
      return;
    }

    switchTheme("dark");
  };

  const toggleTranslucentMode = () => {
    if (theme === "translucent") {
      switchTheme("light");
      return;
    }

    switchTheme("translucent");
  };

  const value = useMemo(
    () => ({
      darkMode: theme === "dark",
      translucentMode: theme === "translucent",
      toggleDarkMode,
      toggleTranslucentMode,
      setTheme: switchTheme,
      theme,
    }),
    [theme],
  );

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
