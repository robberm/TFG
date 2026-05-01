import React, { useEffect, useMemo, useState } from "react";
import "../css/AdminUsers.css";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUsers,
} from "../api/adminApi";

// Iconos
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const initialForm = {
  username: "",
  password: "",
};

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users],
  );

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getManagedUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      setErrorMessage(error.message || "No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.username.trim() || !form.password.trim()) {
      setErrorMessage("Debes indicar username y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createManagedUser({
        username: form.username.trim(),
        password: form.password,
      });

      setUsers((current) => [...current, created]);
      setForm(initialForm);
      setSuccessMessage(`Usuario ${created.username} creado correctamente.`);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo crear el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setErrorMessage("");
    setSuccessMessage("");

    const confirmed = window.confirm(
      `¿Seguro que quieres dar de baja a ${username}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteManagedUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      setSuccessMessage(`Usuario ${username} eliminado correctamente.`);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo eliminar el usuario.");
    }
  };

  return (
    <div className="adminUsersPage">
      <header className="adminUsersHeader">
        <h1>Gestión de usuarios</h1>
        <p>Alta y baja de usuarios subordinados de tu organización.</p>
      </header>

      <section className="adminUsersCard">
        <h2>Crear usuario subordinado</h2>

        <form className="adminUsersForm" onSubmit={handleCreateUser}>
          <label>
            Username
            <input
              type="text"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              placeholder="usuario.subordinado"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Contraseña"
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Dar de alta"}
          </button>
        </form>
      </section>

      <section className="adminUsersCard">
        <div className="adminUsersListHeader">
          <h2>Usuarios subordinados</h2>
          <button type="button" onClick={loadUsers} disabled={isLoading}>
            <RefreshIcon />
            Recargar
          </button>
        </div>

        {errorMessage && <p className="adminFeedback error">{errorMessage}</p>}
        {successMessage && (
          <p className="adminFeedback success">{successMessage}</p>
        )}

        {isLoading ? (
          <div className="adminLoading">
            <div className="adminSpinner" />
            <span>Cargando usuarios...</span>
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="adminEmptyState">
            <UsersIcon />
            <p>No hay usuarios subordinados.</p>
          </div>
        ) : (
          <div className="adminUsersTableWrap">
            <table className="adminUsersTable">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Organización</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.organizationName || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        Dar de baja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminUsersPage;