import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [singleOpen, setSingleOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setSingleOpen(false);
        setModeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return managedUsers;
    return managedUsers.filter((user) => user.username.toLowerCase().includes(term));
  }, [managedUsers, query]);

  const selectedUsers = useMemo(
    () => managedUsers.filter((user) => selectedUserIds.includes(String(user.id))),
    [managedUsers, selectedUserIds],
  );

  const selectedSingleUser = managedUsers.find((user) => String(user.id) === String(singleUserId));

  const modeOptions = [
    { value: "single", label: t.commonUser, selected: mode === "single" },
    { value: "multiple", label: t.commonMultipleUsers, selected: mode === "multiple" },
    { value: "all", label: t.commonAllOrganization, selected: mode === "all" },
  ];

  const DropdownList = ({ label, valueLabel, isOpen, onToggle, options, onSelect }) => (
    <div className="admin-assignment-dropdown">
      {label && <label>{label}</label>}
      <button type="button" className={`admin-assignment-input admin-assignment-trigger ${isOpen ? "active" : ""}`} onClick={onToggle}>
        <span>{valueLabel}</span>
        <span>▾</span>
      </button>
      {isOpen && (
        <div className={`admin-assignment-results admin-assignment-results-inline`}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`admin-assignment-result ${option.selected ? "selected" : ""}`}
              onClick={() => onSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.selected && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-assignment-panel" ref={rootRef}>
      <DropdownList
        label={t.commonAssignment}
        valueLabel={modeOptions.find((opt) => opt.selected)?.label || t.commonAssignment}
        isOpen={modeOpen}
        onToggle={() => {
          setModeOpen((prev) => !prev);
          setSingleOpen(false);
        }}
        options={modeOptions}
        onSelect={(value) => {
          onModeChange(value);
          setModeOpen(false);
        }}
      />

      {mode === "single" && (
        <DropdownList
          label={t.commonUser}
          valueLabel={selectedSingleUser?.username || singlePlaceholder || t.commonSelectUser}
          isOpen={singleOpen}
          onToggle={() => {
            setSingleOpen((prev) => !prev);
            setModeOpen(false);
          }}
          options={managedUsers.map((user) => ({ value: String(user.id), label: user.username, selected: String(user.id) === String(singleUserId) }))}
          onSelect={(value) => {
            onSingleUserChange(value);
            setSingleOpen(false);
          }}
        />
      )}

      {mode === "all" && <div className="admin-assignment-all-confirm">✓ {t.commonAllOrganization} — se asignará a todos los usuarios subordinados.</div>}

      {mode === "multiple" && (
        <div className="admin-assignment-multi">
          <input type="text" className="admin-assignment-input" placeholder="Buscar usuarios..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
                <button type="button" key={user.id} className={`admin-assignment-result ${checked ? "selected" : ""}`} onClick={() => onToggleUser(user.id)}>
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
