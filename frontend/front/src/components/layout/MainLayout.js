import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import WindowTitleBar from "./WindowTitleBar";
import "../../css/MainLayout.css";

const isElectronEnvironment =
  typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

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
                <i className="fa fa-home"></i> &nbsp; Home
              </NavLink>

              <NavLink to="/calendar">
                <i className="fa fa-calendar"></i> &nbsp; Calendar
              </NavLink>

              <NavLink to="/objectives">
                <i className="fa fa-bullseye"></i> &nbsp; Objectives
              </NavLink>

              <NavLink to="/block">
                <i className="fa fa-bullseye"></i> &nbsp; Block
              </NavLink>
            </nav>
          </aside>

          <div className="mainContent">
            <div className="userMenuContainer">
              <UserMenu />
            </div>

            <div className="pageContent">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
