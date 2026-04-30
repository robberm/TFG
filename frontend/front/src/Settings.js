import React, { useEffect, useState } from "react";
import { useDarkMode } from "./DarkModeContext";
import "./css/Settings.css";
import { resolveProfileImageUrl } from "./utils/profileImage";
import {
  changeCurrentPassword,
  changeCurrentUsername,
  deleteCurrentUserProfileImage,
  getCurrentUserProfile,
  updateCurrentUserProfileImage,
} from "./api/userApi";
import { getApiErrorMessage } from "./api/apiClient";

const Settings = () => {
  const { darkMode, translucentMode, toggleDarkMode, toggleTranslucentMode } =
    useDarkMode();

  const [username, setUsername] = useState(
    localStorage.getItem("username") || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    loadCurrentUserProfile();
  }, []);

  const loadCurrentUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await getCurrentUserProfile({ forceRefresh: true });

      if (data?.username) {
        setUsername(data.username);
        localStorage.setItem("username", data.username);
      }

      if (data?.profileImagePath) {
        const profileUrl = resolveProfileImageUrl(data.profileImagePath);
        setProfileImage(profileUrl);
        localStorage.setItem("profileImage", profileUrl);
      } else {
        setProfileImage("");
        localStorage.removeItem("profileImage");
      }
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error, "No se pudo cargar el perfil."));
      setProfileError(true);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const data = await updateCurrentUserProfileImage(file);

      if (data?.username) {
        localStorage.setItem("username", data.username);
      }

      if (data?.profileImagePath) {
        const profileUrl = resolveProfileImageUrl(data.profileImagePath);
        setProfileImage(profileUrl);
        localStorage.setItem("profileImage", profileUrl);
      } else {
        setProfileImage("");
        localStorage.removeItem("profileImage");
      }

      setProfileMessage(
        data?.message || "Imagen de perfil actualizada correctamente.",
      );
      setProfileError(false);
      e.target.value = "";
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error, "No se pudo actualizar la foto de perfil."));
      setProfileError(true);
      e.target.value = "";
    }
  };

  const handleRemoveProfileImage = async () => {
    try {
      const data = await deleteCurrentUserProfileImage();

      setProfileImage("");
      setProfileMessage(data?.message || "Imagen eliminada correctamente.");
      setProfileError(false);
    } catch (error) {
      setProfileMessage(getApiErrorMessage(error, "No se pudo eliminar la foto."));
      setProfileError(true);
    }
  };

  const handleUsernameSave = async () => {
    if (!username || !currentPassword) {
      setUsernameMessage(
        "Debes introducir el nuevo username y tu contraseña actual.",
      );
      setUsernameError(true);
      return;
    }

    try {
      setUsernameMessage("");
      const data = await changeCurrentUsername(username, currentPassword);
      const message = data?.message || "Username actualizado correctamente.";

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      setUsername(data.username);
      setUsernameMessage(message);
      setUsernameError(false);
      setCurrentPassword("");
    } catch (error) {
      setUsernameMessage(getApiErrorMessage(error, "No se pudo actualizar el username."));
      setUsernameError(true);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Debes rellenar todos los campos.");
      setPasswordError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Las contraseñas no coinciden.");
      setPasswordError(true);
      return;
    }

    try {
      setPasswordMessage("");
      const data = await changeCurrentPassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      const message = data?.message || "Contraseña actualizada correctamente.";

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      setPasswordMessage(message);
      setPasswordError(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(getApiErrorMessage(error, "No se pudo actualizar la contraseña."));
      setPasswordError(true);
    }
  };

  return (
    <div className="settingsPage">
      <div className="settingsContainer">
        <h1 className="settingsTitle">Settings</h1>

        <section className="settingsCard">
          <div className="settingsCardHeader">
            <h2>Apariencia</h2>
            <p>Personaliza cómo se ve la aplicación.</p>
          </div>

          <div className="settingsRow">
            <div>
              <span className="settingsLabel">Tema oscuro</span>
              <p className="settingsHint">Activa o desactiva el modo oscuro.</p>
            </div>

            <button
              type="button"
              className={`settingsSwitch ${darkMode ? "active" : ""}`}
              onClick={toggleDarkMode}
            >
              <span className="settingsSwitchThumb"></span>
            </button>
          </div>

          <div className="settingsRow">
            <div>
              <span className="settingsLabel">Tema translúcido</span>
              <p className="settingsHint">
                Hace la ventana transparente para que se vea el escritorio.
              </p>
            </div>

            <button
              type="button"
              className={`settingsSwitch ${translucentMode ? "active" : ""}`}
              onClick={toggleTranslucentMode}
            >
              <span className="settingsSwitchThumb"></span>
            </button>
          </div>
        </section>

        <section className="settingsCard">
          <div className="settingsCardHeader">
            <h2>Perfil</h2>
            <p>Actualiza tu foto de perfil.</p>
          </div>

          <div className="profileSection">
            <div className="profileAvatarPreview">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile preview"
                  className="profileAvatarImage"
                />
              ) : (
                <span className="profileAvatarFallback">
                  {(username || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="profileActions">
              <label className="settingsButton primary">
                Subir foto
                <input
                  type="file"
                  accept="image/*"
                  className="hiddenFileInput"
                  onChange={handleProfileImageChange}
                />
              </label>

              <button
                type="button"
                className="settingsButton secondary"
                onClick={handleRemoveProfileImage}
              >
                Quitar foto
              </button>
            </div>
          </div>
          {profileMessage && (
            <p className={`accountMessage ${profileError ? "error" : "success"}`}>
              {profileMessage}
            </p>
          )}
        </section>

        <section className="settingsCard">
          <div className="settingsCardHeader">
            <h2>Cuenta</h2>
            <p>Actualiza tu nombre de usuario.</p>
          </div>

          <div className="settingsFieldGroup">
            <label className="settingsFieldLabel" htmlFor="username">
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              className="settingsInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Introduce tu nuevo nombre de usuario"
            />
          </div>

          <div className="settingsFieldGroup">
            <label
              className="settingsFieldLabel"
              htmlFor="usernameCurrentPassword"
            >
              Contraseña actual
            </label>
            <input
              id="usernameCurrentPassword"
              type="password"
              className="settingsInput"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Introduce tu contraseña actual"
            />
          </div>

          <button
            type="button"
            className="settingsButton primary"
            onClick={handleUsernameSave}
          >
            Guardar username
          </button>
          {usernameMessage && (
            <p className={`accountMessage ${usernameError ? "error" : "success"}`}>
              {usernameMessage}
            </p>
          )}
        </section>

        <section className="settingsCard">
          <div className="settingsCardHeader">
            <h2>Seguridad</h2>
            <p>Cambia tu contraseña de acceso.</p>
          </div>

          <div className="settingsFieldGroup">
            <label className="settingsFieldLabel" htmlFor="currentPassword">
              Contraseña actual
            </label>
            <input
              id="currentPassword"
              type="password"
              className="settingsInput"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Introduce tu contraseña actual"
            />
          </div>

          <div className="settingsFieldGroup">
            <label className="settingsFieldLabel" htmlFor="newPassword">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              className="settingsInput"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Introduce tu nueva contraseña"
            />
          </div>

          <div className="settingsFieldGroup">
            <label className="settingsFieldLabel" htmlFor="confirmPassword">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="settingsInput"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
            />
          </div>

          <button
            type="button"
            className="settingsButton primary"
            onClick={handlePasswordSave}
          >
            Cambiar contraseña
          </button>
          {passwordMessage && (
            <p className={`accountMessage ${passwordError ? "error" : "success"}`}>
              {passwordMessage}
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
