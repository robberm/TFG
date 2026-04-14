import React, { useEffect, useMemo, useState } from "react";
import "../css/AdminUsers.css";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUsers,
} from "../api/adminApi";

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
            Recargar
          </button>
        </div>

        {errorMessage && <p className="adminFeedback error">{errorMessage}</p>}
        {successMessage && (
          <p className="adminFeedback success">{successMessage}</p>
        )}

        {isLoading ? (
          <p className="adminUsersStatus">Cargando usuarios...</p>
        ) : sortedUsers.length === 0 ? (
          <p className="adminUsersStatus">No hay usuarios subordinados.</p>
        ) : (
          <div className="adminUsersTableWrap">
            <table className="adminUsersTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Organización</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
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
