import React, { useState, useRef } from "react";
import './css/App.css';
import { useNavigate } from "react-router-dom";
import PasswordInput from "./components/PasswordInput";
import {
  getApiErrorMessage,
} from "./api/apiClient";
import { loginUser, registerActiveSessionUser } from "./api/authApi";
import { getCurrentUserProfile } from "./api/userApi";
import { resolveProfileImageUrl } from "./utils/profileImage";
import { useError } from "./components/ErrorContext";


const Login = () => {
  // Definir estado para username y password
  const [loginUsername, setLoginUsername] = useState("");  // Estado para el nombre de usuario
  const [loginPw, setLoginPw] = useState("");  // Estado para la contraseña
  const { setErrorMessage } = useError();

  // Usamos useRef para el campo de contraseña
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setErrorMessage("");
      const data = await loginUser(loginUsername, loginPw);
      //pasamos token de sesión
        const token = data.token.trim(); 
        localStorage.setItem("token", token); 
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role || "PERSONAL");
        localStorage.setItem("organizationId", data.organizationId ?? "");

        const profile = await getCurrentUserProfile({ forceRefresh: true });
        if (profile?.profileImagePath) {
          localStorage.setItem(
            "profileImage",
            resolveProfileImageUrl(profile.profileImagePath),
          );
        } else {
          localStorage.removeItem("profileImage");
        }
        const isAdmin = (data.role || profile?.role) === "ADMIN";
        const hasOrganization = Boolean((data.organizationId ?? profile?.organizationId));
        const nextPath = isAdmin
          ? hasOrganization
            ? "/admin"
            : "/admin/setup-organization"
          : "/home";

        //Registramos usuario en la sesión 
        await registerActiveSessionUser();
        // Redirige según rol
        console.log("Login perfecto");
        navigate(nextPath);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Error de conexión, inténtalo de nuevo."));
      
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.name === "username") {
        passwordInputRef.current.focus(); // Foco en la contraseña
      } else {
        handleLogin(e);  // Si es la contraseña, realiza el login
      }
    }
  };

  const colorLogInTexto = {
    color: "#FFFFFF" 
  };

  

  return (
    <div className="login-form">
      <h2 style={colorLogInTexto}>Log-in</h2>
      <form onSubmit={handleLogin}>
        <input
          className="app-input"
          name="username"
          type="text"
          placeholder="Username"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)} // Actualiza el estado
          onKeyDown={handleKeyDown} // Manejo de la tecla Enter
        />
        <PasswordInput
          className="app-input"
          id="password"
          name="password"
          placeholder="Password"
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={passwordInputRef}
          autoComplete="new-password"
        />
        <button className="app-button" type="submit">
          Log-in
        </button>
      </form>
    </div>
  );
}

export default Login;
