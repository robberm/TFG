import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminOrganization } from "../api/adminApi";
import "../css/AdminUsers.css";

function AdminOrganizationSetupPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const normalizedName = organizationName.trim();
    if (!normalizedName) {
      setErrorMessage("Debes indicar un nombre para la organización.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAdminOrganization(normalizedName);
      navigate("/admin", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "No se pudo crear la organización.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="adminUsersPage">
      <header className="adminUsersHeader">
        <h1>Configura tu organización</h1>
        <p>
          Primer acceso detectado: antes de usar la vista admin, debes crear la
          organización que vas a gestionar.
        </p>
      </header>

      <section className="adminUsersCard">
        <h2>Alta de organización</h2>

        <form className="adminUsersForm" onSubmit={handleSubmit}>
          <label>
            Nombre de la organización
            <input
              type="text"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Ej: Academia Productiva"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear organización"}
          </button>
        </form>

        {errorMessage ? <p className="adminFeedback error">{errorMessage}</p> : null}
      </section>
    </div>
  );
}

export default AdminOrganizationSetupPage;
