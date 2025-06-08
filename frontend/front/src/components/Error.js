import React from "react"; 
import {useError} from "./ErrorContext";
import './Components.css';

function ErrorBox(){



   const { errorMessage, setErrorMessage } = useError(); //Usamos { } en vez de [ ] ya que useState devuelve un array siendo 0. La cte y 1. setCte q es la funcion q lo actualiza
   /**  En este caso utilizamos corchetees para destructurar el objeto, ya que useError es un objeto de ErrorContext**/

    if (!errorMessage) return null; // No lanza si no hay error

    return (
        <div className="error-box">
          {errorMessage}
        <button className="error-close-button" onClick={() => setErrorMessage("")}aria-label="Cerrar error">
        &times; {/*Simbolo X para el boton, caracter especial */}
      </button>
    </div>
  );
}

export default ErrorBox;