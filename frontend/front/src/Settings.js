import React from 'react';
import { useDarkMode } from './DarkModeContext';
import './css/Settings.css';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="toggle-theme-wrapper">
      <span>Dark Mode</span>
      <label className="toggle-theme" htmlFor="checkbox">
        <input
          type="checkbox"
          id="checkbox"
          onChange={toggleDarkMode}
          checked={darkMode}
        />
        <div className="slider round"></div>
      </label>
    </div>
  );
};

export default Settings;
