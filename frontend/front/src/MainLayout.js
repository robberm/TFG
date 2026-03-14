import React from "react";
import { useLocation } from "react-router-dom";
import UserMenu from "./UserMenu";
import "./css/MainLayout.css";
import { Link } from "react-router-dom";

const MainLayout = ({ children }) => {
  const iconLocation = "C:\TFGrmg\TFG\tools";
  const location = useLocation();

  const showSidebar = location.pathname !== "/";

  const handleMinimize = () => {
    if (window.electronWindow?.minimize) {
      window.electronWindow.minimize();
    }
  };

  const handleToggleMaximize = () => {
    if (window.electronWindow?.toggleMaximize) {
      window.electronWindow.toggleMaximize();
    }
  };

  const handleClose = () => {
    if (window.electronWindow?.close) {
      window.electronWindow.close();
    }
  };

  if (!showSidebar) {
    return children;
  }

  return (
    <div className="appShell">
      <div className="customTitleBar">
        <div className="customTitleBarDrag">
          <div className="customTitleBarBrand">
            <img
              src={location}
              alt="App icon"
              className="customTitleBarIcon"
            />
            <span className="customTitleBarTitle">TFG App</span>
          </div>
        </div>

        <div className="customTitleBarActions">
          <button
            type="button"
            className="titleBarButton"
            onClick={handleMinimize}
          >
            —
          </button>
          <button
            type="button"
            className="titleBarButton"
            onClick={handleToggleMaximize}
          >
            □
          </button>
          <button
            type="button"
            className="titleBarButton titleBarButtonClose"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="homeFrame">
        <div className="sideBar">
          <div className="menuHeader">
            <h3>Menu</h3>
          </div>
          <nav className="menuItems">
            <Link to="/home">
              <i className="fa fa-home"></i> &nbsp; Home
            </Link>
            <Link to="/calendar">
              <i className="fa fa-calendar"></i>&nbsp; Calendar
            </Link>
            <Link to="/objectives">
              <i className="fa fa-bullseye"></i>&nbsp; Objectives{" "}
            </Link>
            <Link to="/block">
              <i className="fa fa-bullseye"></i>&nbsp; Block{" "}
            </Link>
          </nav>
        </div>

        <div className="mainContent">
          <div className="userMenuContainer">
            <UserMenu />
          </div>
          <div className="pageContent">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
