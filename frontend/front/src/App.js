import { useState, useEffect } from 'react';
import './css/App.css';
import Login from './Login'; 
import Register from './Register';


/* */
const CONFIG_ANIMACION = {
  retrasoInicial: 500, //en ms .
  duracionAparecer: 1500,
  duracionEscalar: 1000,
  duracionDesaparecer: 2000,
  nombreApp: 'Martin',
  colorTexto: '#ffffff',
  colorNombreApp: '#000000',
  colorFondo: '#111111',
  
  escala: 1.05,
};

function App() {
  
  const [showForm, setShowForm] = useState(null);
  const [config, setConfig] = useState(CONFIG_ANIMACION);
  const [etapaAnimacion, setEtapaAnimacion] = useState(0);
  
  const[showButtons,setShowButtons] = useState(true);

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

  //Estilos para el texto animado :)
  const estiloContenedor = {
    backgroundColor: config.colorFondo,
  };

  const estiloTexto = {
    color: config.colorTexto,
    '--factor-escala': config.escala,
  };

 const estiloNombreApp = {
  color: 'transparent',
  WebkitTextStroke: '1px #000000',
  textStroke: '2px #000000' 
};

 

    const handleFormSelection = (form) => {
    setShowForm(form); 
    setShowButtons(false);// Cambiar entre "login" o "register"
  };

   const goBack = () => {
    setShowForm(null);
    setShowButtons(true) // Volver a la pantalla inicial
  };
   //NOTAS:
   /* Utilizamos span para encapsular la palabra y su estilo*/

   return (
    
     
     
      <div className="contenedor-app">
       <video  className="video-bg" autoPlay  loop  muted playsInline>
      <source src="rrs/white-waves-background.mp4" type="video/mp4" />
      
    </video>
        <div className={obtenerClasesAnimacion()} style={estiloTexto}>
          Welcome to <span className="nombre-app" style={estiloNombreApp}>{config.nombreApp}</span> 
        </div>
              
        {showButtons && (
          <div className="form-selection">
            <button onClick={() => handleFormSelection('login')}>Log-in</button>
            <button onClick={() => handleFormSelection('register')}>Register</button>
          </div>
        )}

        {/* Renderiza el formulario de login o registro sin cambiar de URL */}
        {showForm === 'login' && <Login />}
        {showForm === 'register' && <Register />}

        {/* Botón de "Volver" para regresar */}
        {showForm && (
          <button onClick={goBack}>Volver</button>
        )}
      </div>
    
  );
}

export default App;