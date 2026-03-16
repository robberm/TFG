import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import "../../css/UserMenu.css";

function UserMenu() {
  const [userMenuIsOpen, setUserMenuIsOpen] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const userInitial = username.charAt(0).toUpperCase();
  const profileImage = localStorage.getItem("profileImage");


  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/session/clear", {
        method: "POST",
      });
    } catch (err) {
      console.warn("Log out failed.", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const location = useLocation();

  useEffect(() => {
    setUserMenuIsOpen(false);
  }, [location]);

 

  return (
    <div className="userMenuFrame">
      <button
        type="button"
        className="userMenuTrigger"
        onClick={() => setUserMenuIsOpen(!userMenuIsOpen)}
      >
        <div className="userAvatar">
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${username} profile`}
              className="userAvatarImage"
            />
          ) : (
            <span className="userAvatarFallback">{userInitial}</span>
          )}
        </div>

        <div className="userInfo">
          <span className="userName">{username}</span>
          <span className="userRole">Mi cuenta</span>
        </div>

        <i
          className={`fa fa-chevron-down userFlecha ${userMenuIsOpen ? "open" : ""}`}
        ></i>
      </button>

      {userMenuIsOpen && (
        <div className="userMenuPop">
          <Link
            to="/settings"
            className="menuItem"
            onClick={() => setUserMenuIsOpen(false)}
          >
            <i className="fa fa-cog"></i>
            <span>Settings</span>
          </Link>

          <div className="menuItem logout" onClick={handleLogout}>
            <i className="fa fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
