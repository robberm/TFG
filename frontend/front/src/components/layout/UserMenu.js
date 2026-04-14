import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import "../../css/UserMenu.css";

function UserMenu() {
  const [userMenuIsOpen, setUserMenuIsOpen] = useState(false);
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "User",
  );
  const [profileImage, setProfileImage] = useState("");

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

    try {
      const response = await fetch("http://localhost:8080/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo cargar el perfil.");
      }

      if (data?.username) {
        setUsername(data.username);
        localStorage.setItem("username", data.username);
      }

      if (data?.profileImagePath) {
        setProfileImage(
          `http://localhost:8080/uploads/${data.profileImagePath}`,
        );
      } else {
        setProfileImage("");
      }
    } catch (error) {
      console.warn("No se pudo cargar la información del perfil.", error);
      setProfileImage("");
    }
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
