import React, { useMemo, useState } from "react";
import "../css/AdminAssignmentSelector.css";
import { useLanguage } from "../context/languageContext";

const AdminAssignmentSelector = ({
  mode,
  onModeChange,
  singleUserId,
  onSingleUserChange,
  selectedUserIds = [],
  onToggleUser,
  managedUsers = [],
  singlePlaceholder,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return managedUsers;
    return managedUsers.filter((user) =>
      user.username.toLowerCase().includes(term),
    );
  }, [managedUsers, query]);

  const selectedUsers = useMemo(
    () => managedUsers.filter((user) => selectedUserIds.includes(String(user.id))),
    [managedUsers, selectedUserIds],
  );

  return (
    <div className="admin-assignment-panel">
      <label>{t.commonAssignment}</label>
      <select className="admin-assignment-input" value={mode} onChange={(e) => onModeChange(e.target.value)}>
        <option value="single">{t.commonUser}</option>
        <option value="multiple">{t.commonMultipleUsers}</option>
        <option value="all">{t.commonAllOrganization}</option>
      </select>

      {mode === "single" && (
        <select className="admin-assignment-input" value={singleUserId} onChange={(e) => onSingleUserChange(e.target.value)} required>
          <option value="">{singlePlaceholder || t.commonSelectUser}</option>
          {managedUsers.map((user) => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
      )}

      {mode === "all" && (
        <div className="admin-assignment-all-confirm">✓ {t.commonAllOrganization} — se asignará a todos los usuarios subordinados.</div>
      )}

      {mode === "multiple" && (
        <div className="admin-assignment-multi">
          <input
            type="text"
            className="admin-assignment-input"
            placeholder="Buscar usuarios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {selectedUsers.length > 0 && (
            <div className="admin-assignment-tags">
              {selectedUsers.map((user) => (
                <button type="button" key={user.id} className="admin-assignment-tag" onClick={() => onToggleUser(user.id)}>
                  {user.username} <span>×</span>
                </button>
              ))}
            </div>
          )}
          <div className="admin-assignment-results">
            {filteredUsers.map((user) => {
              const checked = selectedUserIds.includes(String(user.id));
              return (
                <button
                  type="button"
                  key={user.id}
                  className={`admin-assignment-result ${checked ? "selected" : ""}`}
                  onClick={() => onToggleUser(user.id)}
                >
                  <span>{user.username}</span>
                  {checked && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentSelector;
