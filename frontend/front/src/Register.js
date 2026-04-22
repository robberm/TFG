import React, { useState, useRef } from "react";
import "./css/App.css";
import { useNavigate } from "react-router-dom";
import PasswordInput from "./components/PasswordInput";
import { getApiErrorMessage } from "./api/apiClient";
import { registerActiveSessionUser, registerUser } from "./api/authApi";
import { useError } from "./components/ErrorContext";

const Register = () => {
  // Definir estado para username y password
  const [registerUsername, setRegisterUsername] = useState(""); // Estado para el nombre de usuario
  const [registerPw, setRegisterPw] = useState(""); // Estado para la contraseña
  const { setErrorMessage } = useError();

  // Usamos useRef para el campo de contraseña
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const normalizedUsername = registerUsername.trim();
    const normalizedPassword = registerPw.trim();

    if (!normalizedUsername) {
      setErrorMessage("El username es obligatorio.");
      return;
    }

    if (normalizedUsername.includes(" ")) {
      setErrorMessage("El username no puede contener espacios.");
      return;
    }

    if (!normalizedPassword) {
      setErrorMessage("La contraseña es obligatoria.");
      return;
    }

    try {
      setErrorMessage("");
      const data = await registerUser(normalizedUsername, normalizedPassword);
      const token = data.token.trim();

      localStorage.setItem("token", token);
      localStorage.setItem("username", data.username);

      //  Marco sesión activa en backend
      await registerActiveSessionUser();

      // 3) Ir a home ya logged in
      navigate("/home");
    } catch (err) {
      console.log(err);
      setErrorMessage(getApiErrorMessage(err, "Error de conexión, inténtalo de nuevo."));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.name === "username") {
        passwordInputRef.current.focus(); // Foco en la contraseña
      } else {
        handleRegister(e); // Si es la contraseña, realiza el registro
      }
    }
  };

  const colorRegisterTexto = {
    color: "#FFFFFF", // Color blanco para el texto de la página de registro
  };

  return (
    <div className="register-form">
      <h2 style={colorRegisterTexto}>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          className="app-input"
          name="username"
          type="text"
          placeholder="Username"
          value={registerUsername}
          onChange={(e) => setRegisterUsername(e.target.value)} // Actualiza el estado
          onKeyDown={handleKeyDown} // Manejo de la tecla Enter
        />
        <PasswordInput
          className="app-input"
          id="password"
          name="password"
          placeholder="Password"
          value={registerPw}
          onChange={(e) => setRegisterPw(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={passwordInputRef}
          autoComplete="new-password"
        />
        <button className="app-button" type="submit">
          Register
        </button>
      </form>
      <h4 style={colorRegisterTexto}>
        La contraseña debe tener al menos 10 caracteres, incluir letras, un
        número y un símbolo
      </h4>
    </div>
  );
};

export default Register;
