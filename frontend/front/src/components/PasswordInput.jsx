import React, { useState, forwardRef } from "react";
import "../css/PasswordInput.css";

const EyeIcon = ({ visible }) => (
  <svg
    className="eye-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {visible ? (
      
      <path d="M3 14C3 9.02944 7.02944 5 12 5C16.9706 5 21 9.02944 21 14M17 14C17 16.7614 14.7614 19 12 19C9.23858 19 7 16.7614 7 14C7 11.2386 9.23858 9 12 9C14.7614 9 17 11.2386 17 14Z" />
    ) : (
     
      <>
        <path d="M9.61 9.61C8.06 10.45 7 12.1 7 14C7 16.76 9.24 19 12 19C13.9 19 15.55 17.94 16.39 16.39" />
        <path d="M21 14C21 9.03 16.97 5 12 5C11.56 5 11.12 5.03 10.7 5.09" />
        <path d="M3 14C3 11.01 4.46 8.36 6.71 6.72" />
        <path d="M3 3L21 21" />
      </>
    )}
  </svg>
);

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  name = "password",
  className = "app-input",
}) {
  const [showPassword, setShowPassword] = useState(false);

  const toggle = () => setShowPassword((v) => !v);

  return (
    <div className="password-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        autoComplete="new-password"
      />

      <button
        type="button"
        className="toggle-password-btn"
        onClick={toggle}
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {/* Ojo abierto cuando es visible, ojo tachado cuando NO */}
        <EyeIcon visible={showPassword} />
      </button>
    </div>
  );
}