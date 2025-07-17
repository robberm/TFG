import React, { useState, useRef } from "react";
import './css/App.css';
import { useNavigate } from "react-router-dom"


const Login = () => {
  // Definir estado para username y password
  const [loginUsername, setLoginUsername] = useState("");  // Estado para el nombre de usuario
  const [loginPw, setLoginPw] = useState("");  // Estado para la contraseña
  const [error, setError] = useState(null);  // Estado para el mensaje de error

  // Usamos useRef para el campo de contraseña
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loginUsername, password: loginPw }),
      });
     // por si falla la request, definimos un LOG:
     

      if (response.ok) {
        //pasamos token de sesión
        const data = await response.json();  //convierte response de Java en un objeto Javascript.
        localStorage.setItem("token",  data.token.trim());
        localStorage.setItem("username", data.username);
        // Redirige a la home
        console.log("Login perfecto");
        navigate("/home");
      } else {
        const errorMessage = await response.text();
        setError(errorMessage);;
      }
    } catch (err) {
      setError("Error query, try again.");
      
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
        <input
          className="app-input"
          name="password"
          type="password"
          placeholder="Password"
          value={loginPw}
          onChange={(e) => setLoginPw(e.target.value)} // Actualiza el estado
          onKeyDown={handleKeyDown} // Manejo de la tecla Enter
          ref={passwordInputRef} // Referencia para el campo de contraseña
        />
        {error && <div className="error">{error}</div>} {/* Mostrar error */}
        <button className="app-button" type="submit">
          Log-in
        </button>
      </form>
    </div>
  );
}

export default Login;
