import React, { useEffect, useMemo, useState } from "react";
import "../css/Home.css";
import PieChart from "../PieChart.jsx";
import HomeHeader from "../features/home/HomeHeader.jsx";
import DailyWidget from "../features/home/DailyWidget.jsx";
import RemindersPanel from "../features/home/RemindersPanel.js";
import useTodayEvents from "../hooks/useTodayEvents.jsx";
import { getCurrentUserProfile } from "../api/userApi";
import { getManagedUserGoals, getManagedUsers } from "../api/adminApi";

const Home = () => {
  const { todayEvents, refreshTodayEvents, isLoadingTodayEvents } =
    useTodayEvents();

  const [isAdmin, setIsAdmin] = useState(false);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedManagedUserId, setSelectedManagedUserId] = useState("");
  const [selectedUserGoals, setSelectedUserGoals] = useState([]);

  useEffect(() => {
    const loadAdminContext = async () => {
      try {
        const profile = await getCurrentUserProfile();
        const adminMode = profile?.role === "ADMIN";
        setIsAdmin(adminMode);

        if (!adminMode) {
          return;
        }

        const users = await getManagedUsers();
        const normalizedUsers = Array.isArray(users) ? users : [];
        setManagedUsers(normalizedUsers);

        if (normalizedUsers.length > 0) {
          const firstUserId = String(normalizedUsers[0].id);
          setSelectedManagedUserId(firstUserId);
        }
      } catch (_) {
        setIsAdmin(false);
      }
    };

    loadAdminContext();
  }, []);

  useEffect(() => {
    const loadGoals = async () => {
      if (!isAdmin || !selectedManagedUserId) {
        setSelectedUserGoals([]);
        return;
      }

      try {
        const goals = await getManagedUserGoals(selectedManagedUserId);
        setSelectedUserGoals(Array.isArray(goals) ? goals : []);
      } catch (_) {
        setSelectedUserGoals([]);
      }
    };

    loadGoals();
  }, [isAdmin, selectedManagedUserId]);

  const selectedManagedUser = useMemo(
    () => managedUsers.find((user) => String(user.id) === selectedManagedUserId),
    [managedUsers, selectedManagedUserId],
  );

  if (isAdmin) {
    return (
      <>
        <HomeHeader />

        <div className="homeHeroSection adminHomeSection">
          <div className="adminCardsHeader">
            <h2>Usuarios subordinados</h2>
            <p>Selecciona un usuario para consultar sus métricas de goals.</p>
          </div>

          <div className="adminUsersCardsGrid">
            {managedUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`adminUserCard ${selectedManagedUserId === String(user.id) ? "active" : ""}`}
                onClick={() => setSelectedManagedUserId(String(user.id))}
              >
                <div className="adminUserAvatar">
                  {user.profileImagePath ? (
                    <img
                      src={`http://localhost:8080/uploads/${user.profileImagePath}`}
                      alt={user.username}
                    />
                  ) : (
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="adminUserMeta">
                  <strong>{user.username}</strong>
                  <small>{user.organizationName || "Sin organización"}</small>
                </div>
              </button>
            ))}
          </div>

          {selectedManagedUser ? (
            <div className="adminUserStatsPanel">
              <h3>Stats de goals · {selectedManagedUser.username}</h3>
              <div className="chartContainer compactChart">
                <PieChart goals={selectedUserGoals} />
              </div>
            </div>
          ) : (
            <div className="adminUserStatsPanel">
              <p>No hay usuarios subordinados para mostrar.</p>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <HomeHeader />

      <div className="homeHeroSection">
        <div className="homeHeroGrid">
          <div className="homeLeftColumn">
            <div className="chartSection">
              <div className="chartContainer">
                <PieChart />
              </div>
            </div>

            <RemindersPanel
              todayEvents={todayEvents}
              isLoadingTodayEvents={isLoadingTodayEvents}
            />
          </div>

          <DailyWidget
            events={todayEvents}
            onEventsChanged={refreshTodayEvents}
          />
        </div>
      </div>
    </>
  );
};

export default Home;
