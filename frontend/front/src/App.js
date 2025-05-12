import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login'; 
import Register from './Register';


/* */
const CONFIG_ANIMACION = {
  retrasoInicial: 500,
  duracionAparecer: 1500,
  duracionEscalar: 1000,
  duracionDesaparecer: 2000,
  nombreApp: 'Atomic',
  colorTexto: '#ffffff',
  colorNombreApp: '#29e1cf',
  colorFondo: '#111111',
  escala: 1.05,
};

function App() {
  // Mantén todo dentro del mismo componente `App`
  const [showForm, setShowForm] = useState(null);
  const [config, setConfig] = useState(CONFIG_ANIMACION);
  const [etapaAnimacion, setEtapaAnimacion] = useState(0);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [error, setError] = useState(null);

  // Control de la animación. Avanza las etapas del switch que ira invocando diferentes IFs en el UseEffect que se invoca cada vez que se actualiza etapaAnimacion
  useEffect(() => {
    if (etapaAnimacion === 0) {
      const temporizador1 = setTimeout(() => {
        setEtapaAnimacion(1);
      }, config.retrasoInicial);
      return () => clearTimeout(temporizador1);
    } else if (etapaAnimacion === 1) {
      const temporizador2 = setTimeout(() => {
        setEtapaAnimacion(2);
      }, config.duracionAparecer);
      return () => clearTimeout(temporizador2);
    } else if (etapaAnimacion === 2) {
      const temporizador3 = setTimeout(() => {
        setEtapaAnimacion(3);
      }, config.duracionEscalar);
      return () => clearTimeout(temporizador3);
    } else if (etapaAnimacion === 3) {
      const temporizador4 = setTimeout(() => {
        setEtapaAnimacion(0);
      }, config.duracionDesaparecer);
      return () => clearTimeout(temporizador4);
    }
  }, [etapaAnimacion, config]);

  // Obtener clases para la animación
  const obtenerClasesAnimacion = () => {
    switch (etapaAnimacion) {
      case 0:
        return 'texto-bienvenida oculto';
      case 1:
        return 'texto-bienvenida aparecer elevar';
      case 2:
        return 'texto-bienvenida aparecer elevar escalar';
      case 3:
        return 'texto-bienvenida desvanecer elevar escalar';
      default:
        return 'texto-bienvenida oculto';
    }
  };

  // Estilos dinámicos
  const estiloContenedor = {
    backgroundColor: config.colorFondo,
  };

  const estiloTexto = {
    color: config.colorTexto,
    '--factor-escala': config.escala,
  };

  const estiloNombreApp = {
    color: config.colorNombreApp,
  };

  // Llamada de login
  const callLogin = async (username, password) => {
    const response = await fetch("http://localhost:8080/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      window.location.href = "/home"; // Redirige al home si es correcto
    } else {
      setError("Credenciales incorrectas");
    }
  };

   //NOTAS:
   /* Utilizamos span para encapsular la palabra y su estilo*/

  return (
    <div className="contenedor-app" style={estiloContenedor}>
      <div className={obtenerClasesAnimacion()} style={estiloTexto}>
        
        Welcome to <span className="nombre-app" style={estiloNombreApp}>{config.nombreApp}</span> 
      </div>
      <div className="form-selection">
        <button onClick={() => setShowForm('login')}>Log-in</button>
        <button onClick={() => setShowForm('register')}>Register</button>
      </div>

      {/* Renderiza el formulario correspondiente */}
       {showForm === 'login' && <Login username={loginUsername} setUsername={setLoginUsername} password={loginPw} setPassword={setLoginPw} callLogin={callLogin} />}
      {showForm === 'register' && <Register username={loginUsername} setUsername={setLoginUsername} password={loginPw} setPassword={setLoginPw} />}
    </div>
  );
}

export default App;