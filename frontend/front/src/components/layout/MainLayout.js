import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import WindowTitleBar from "./WindowTitleBar";
import ReminderListener from "./ReminderListener";
import "../../css/MainLayout.css";

const isElectronEnvironment =
  typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

const HomeIcon = () => (
  <svg className="menuIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 17.0002V11.4522C20 10.9179 19.9995 10.6506 19.9346 10.4019C19.877 10.1816 19.7825 9.97307 19.6546 9.78464C19.5102 9.57201 19.3096 9.39569 18.9074 9.04383L14.1074 4.84383C13.3608 4.19054 12.9875 3.86406 12.5674 3.73982C12.1972 3.63035 11.8026 3.63035 11.4324 3.73982C11.0126 3.86397 10.6398 4.19014 9.89436 4.84244L5.09277 9.04383C4.69064 9.39569 4.49004 9.57201 4.3457 9.78464C4.21779 9.97307 4.12255 10.1816 4.06497 10.4019C4 10.6506 4 10.9179 4 11.4522V17.0002C4 17.932 4 18.3978 4.15224 18.7654C4.35523 19.2554 4.74432 19.6452 5.23438 19.8482C5.60192 20.0005 6.06786 20.0005 6.99974 20.0005C7.93163 20.0005 8.39808 20.0005 8.76562 19.8482C9.25568 19.6452 9.64467 19.2555 9.84766 18.7654C9.9999 18.3979 10 17.932 10 17.0001V16.0001C10 14.8955 10.8954 14.0001 12 14.0001C13.1046 14.0001 14 14.8955 14 16.0001V17.0001C14 17.932 14 18.3979 14.1522 18.7654C14.3552 19.2555 14.7443 19.6452 15.2344 19.8482C15.6019 20.0005 16.0679 20.0005 16.9997 20.0005C17.9316 20.0005 18.3981 20.0005 18.7656 19.8482C19.2557 19.6452 19.6447 19.2554 19.8477 18.7654C19.9999 18.3978 20 17.932 20 17.0002Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="menuIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3.75"
      y="5.25"
      width="16.5"
      height="15"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <path
      d="M8 3.75V6.75"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M16 3.75V6.75"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M3.75 9H20.25"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const ObjectivesIcon = () => (
  <svg className="menuIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.9" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M12 2.75V5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M12 19V21.25"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M21.25 12H19"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M5 12H2.75"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const BlockIcon = () => (
  <svg className="menuIcon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3.25L18.75 6V11.25C18.75 15.65 16.12 18.96 12 20.75C7.88 18.96 5.25 15.65 5.25 11.25V6L12 3.25Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 15.5L15.5 8.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
);

const MainLayout = ({ children }) => {
  const location = useLocation();
  const showSidebar = location.pathname !== "/";

  if (!showSidebar) {
    return children;
  }

  return (
    <div className="appShell">
      <div className="appWindowFrame">
        {isElectronEnvironment && <WindowTitleBar />}

        <div className="homeFrame">
          <aside className="sideBar">
            <div className="menuHeader">
              <h3>Menu</h3>
            </div>

            <nav className="menuItems">
              <NavLink to="/home">
                <HomeIcon />
                <span className="menuLabel">Home</span>
              </NavLink>

              <NavLink to="/calendar">
                <CalendarIcon />
                <span className="menuLabel">Calendar</span>
              </NavLink>

              <NavLink to="/objectives">
                <ObjectivesIcon />
                <span className="menuLabel">Objectives</span>
              </NavLink>

              <NavLink to="/block">
                <BlockIcon />
                <span className="menuLabel">Block</span>
              </NavLink>
            </nav>
          </aside>

          <div className="mainContent">
            <div className="userMenuContainer">
              <UserMenu />
            </div>

            <ReminderListener />

            <div className="pageContent">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
