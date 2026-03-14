import React, { createContext, useContext, useEffect, useState } from "react";

const DarkModeContext = createContext();

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
  const storedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  ).matches;

  const [darkMode, setDarkMode] = useState(
    storedTheme ? storedTheme === "dark" : prefersDark,
  );

  const [translucentMode, setTranslucentMode] = useState(
    storedTheme === "translucent",
  );

  useEffect(() => {
    document.body.classList.remove("dark", "light", "translucent");

    let className = "light";

    if (darkMode) {
      className = "dark";
    } else if (translucentMode) {
      className = "translucent";
    }

    document.body.classList.add(className);
    localStorage.setItem("theme", className);
  }, [darkMode, translucentMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        setTranslucentMode(false);
      }
      return next;
    });
  };

  const toggleTranslucentMode = () => {
    setTranslucentMode((prev) => {
      const next = !prev;
      if (next) {
        setDarkMode(false);
      }
      return next;
    });
  };

  return (
    <DarkModeContext.Provider
      value={{
        darkMode,
        translucentMode,
        toggleDarkMode,
        toggleTranslucentMode,
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};
