import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import "../../css/UserMenu.css";

function UserMenu() {
  const [userMenuIsOpen, setUserMenuIsOpen] = useState(false);
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "User",
  );
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || "");

  const navigate = useNavigate();
  const location = useLocation();

  const userInitial = username.charAt(0).toUpperCase();

  useEffect(() => {
    setUserMenuIsOpen(false);
  }, [location]);

  useEffect(() => {
    loadCurrentUserProfile();
  }, [location]);

  const loadCurrentUserProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setProfileImage("");
      return;
    }

    const usernameFromStorage = localStorage.getItem("username");
    const profileImageFromStorage = localStorage.getItem("profileImage");

    if (usernameFromStorage) {
      setUsername(usernameFromStorage);
    }

    setProfileImage(profileImageFromStorage || "");
  };

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
    localStorage.removeItem("profileImage");
    localStorage.removeItem("role");
    localStorage.removeItem("organizationId");

    setProfileImage("");
    navigate("/", { replace: true });
  };

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
