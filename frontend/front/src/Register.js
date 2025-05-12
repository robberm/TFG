import React, { useState, useRef } from "react";
import './App.css';

const Register = () => {
  // Definir estado para username y password
  const [registerUsername, setRegisterUsername] = useState("");  // Estado para el nombre de usuario
  const [registerPw, setRegisterPw] = useState("");  // Estado para la contraseña
  const [error, setError] = useState(null);  // Estado para el mensaje de error

  // Usamos useRef para el campo de contraseña
  const passwordInputRef = useRef(null);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: registerUsername, password: registerPw }),  // Enviamos datos para el registro
      });

      if (response.ok) {
        // Redirige a la home si el registro es exitoso
        console.log("Registro exitoso");
        window.location.href = "/home";  // Redirige a la página principal después del registro
      } else {
        setError("Error al registrar el usuario");  // Muestra error si no fue exitoso
      }
    } catch (err) {
      console.log(err);
      setError("Error de conexión");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.name === "username") {
        passwordInputRef.current.focus(); // Foco en la contraseña
      } else {
        handleRegister(e);  // Si es la contraseña, realiza el registro
      }
    }
  };

  const colorRegisterTexto = {
    color: "#FFFFFF" // Color blanco para el texto de la página de registro
  };

  return (
    <div className="register-form">
      <h2 style={colorRegisterTexto}>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={registerUsername}
          onChange={(e) => setRegisterUsername(e.target.value)}  // Actualiza el estado
          onKeyDown={handleKeyDown}  // Manejo de la tecla Enter
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={registerPw}
          onChange={(e) => setRegisterPw(e.target.value)}  // Actualiza el estado
          onKeyDown={handleKeyDown}  // Manejo de la tecla Enter
          ref={passwordInputRef}  // Referencia para el campo de contraseña
        />
        {error && <div className="error">{error}</div>}  {/* Muestra el error si existe */}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;