import React, { useState, useRef } from "react";
import './css/App.css';
import { useNavigate } from "react-router-dom"

const Register = () => {
  // Definir estado para username y password
  const [registerUsername, setRegisterUsername] = useState("");  // Estado para el nombre de usuario
  const [registerPw, setRegisterPw] = useState("");  // Estado para la contraseña
  const [error, setError] = useState(null);  // Estado para el mensaje de error

  // Usamos useRef para el campo de contraseña
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

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
         navigate("/home");  // Redirige a la página principal después del registro
      } else {
        const errorMessage = await response.text();
        setError(errorMessage); 
      }
    } catch (err) {
      console.log(err);
      setError(("Error query, try again."));
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
          className="app-input"
          name="username"
          type="text"
          placeholder="Username"
          value={registerUsername}
          onChange={(e) => setRegisterUsername(e.target.value)} // Actualiza el estado
          onKeyDown={handleKeyDown} // Manejo de la tecla Enter
        />
        <input
          className="app-input"
          name="password"
          type="password"
          placeholder="Password"
          value={registerPw}
          onChange={(e) => setRegisterPw(e.target.value)} // Actualiza el estado
          onKeyDown={handleKeyDown} // Manejo de la tecla Enter
          ref={passwordInputRef} // Referencia para el campo de contraseña
        />
        <button className="app-button" type="submit">
          Register
        </button>
      </form>
      <h4 style={colorRegisterTexto}>
        La contraseña debe tener al menos 10 caracteres, incluir letras, un
        número y un símbolo
      </h4>
      {error && <div className="error">{error}</div>}{" "}
      {/* Muestra el error si existe */}
    </div>
  );
};

export default Register;