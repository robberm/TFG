import React, { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => useContext(DarkModeContext);

export const DarkModeProvider = ({ children }) => {
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const defaultDark = storedTheme === 'dark' || (!storedTheme && prefersDark);

  const [darkMode, setDarkMode] = useState(defaultDark);

  useEffect(() => {
    const className = darkMode ? 'dark' : 'light';
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(className);
    localStorage.setItem('theme', className);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
