import React, { useEffect, useMemo, useState } from "react";
import "../css/Home.css";
import PieChart from "../PieChart.jsx";
import HomeHeader from "../features/home/HomeHeader.jsx";
import DailyWidget from "../features/home/DailyWidget.jsx";
import RemindersPanel from "../features/home/RemindersPanel.js";
import useTodayEvents from "../hooks/useTodayEvents.jsx";
import { getCurrentUserProfile } from "../api/userApi";
import { getManagedUsers, getManagedUserGoals } from "../api/adminApi";
import { calculateGlobalGoalsProgress } from "../features/objectives/utils/objectiveHelpers";

const AdminGoalsStats = ({ goals }) => {
  const metrics = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((goal) => goal.status === "Done").length;
    const inProgress = goals.filter((goal) => goal.status === "InProgress").length;
    const active = goals.filter(
      (goal) => goal.active !== false && goal.status !== "Done",
    ).length;

    return {
      total,
      completed,
      inProgress,
      active,
      progress: calculateGlobalGoalsProgress(goals),
    };
  }, [goals]);

  return (
    <section className="adminGoalsStats">
      <h3>Estadísticas de goals</h3>
      <div className="adminGoalsStatsGrid">
        <article className="adminGoalsMetricCard">
          <span>Total</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="adminGoalsMetricCard">
          <span>Activos</span>
          <strong>{metrics.active}</strong>
        </article>
        <article className="adminGoalsMetricCard">
          <span>En progreso</span>
          <strong>{metrics.inProgress}</strong>
        </article>
        <article className="adminGoalsMetricCard">
          <span>Completados</span>
          <strong>{metrics.completed}</strong>
        </article>
      </div>

      <div className="adminGoalsProgressBlock">
        <div className="progressBarContainer goalsSummaryProgressBar">
          <div
            className="progressBarFill"
            style={{ width: `${metrics.progress}%` }}
          ></div>
        </div>
        <span className="progressText">Avance global del usuario seleccionado</span>
      </div>
    </section>
  );
};

const Home = () => {
  const { todayEvents, refreshTodayEvents, isLoadingTodayEvents } =
    useTodayEvents();

  const [profile, setProfile] = useState(null);
  const [managedUsers, setManagedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserGoals, setSelectedUserGoals] = useState([]);
  const [isLoadingAdminGoals, setIsLoadingAdminGoals] = useState(false);

  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    const loadHomeScope = async () => {
      try {
        const currentProfile = await getCurrentUserProfile();
        setProfile(currentProfile);

        if (currentProfile?.role === "ADMIN") {
          const users = await getManagedUsers();
          const normalizedUsers = Array.isArray(users) ? users : [];
          setManagedUsers(normalizedUsers);

          if (normalizedUsers.length > 0) {
            setSelectedUser(normalizedUsers[0]);
          }
        }
      } catch (error) {
        console.error("Error loading home scope:", error);
      }
    };

    loadHomeScope();
  }, []);

  useEffect(() => {
    const loadGoals = async () => {
      if (!isAdmin || !selectedUser?.id) {
        setSelectedUserGoals([]);
        return;
      }

      setIsLoadingAdminGoals(true);
      try {
        const goals = await getManagedUserGoals(selectedUser.id);
        setSelectedUserGoals(Array.isArray(goals) ? goals : []);
      } catch (error) {
        console.error("Error loading managed user goals:", error);
        setSelectedUserGoals([]);
      } finally {
        setIsLoadingAdminGoals(false);
      }
    };

    loadGoals();
  }, [isAdmin, selectedUser]);

  if (isAdmin) {
    return (
      <>
        <HomeHeader />

        <div className="adminHomeSection">
          <div className="adminUsersCardsGrid">
            {managedUsers.length === 0 && (
              <p className="adminHomeEmptyState">
                No tienes usuarios subordinados todavía.
              </p>
            )}

            {managedUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`adminUserCard ${selectedUser?.id === user.id ? "selected" : ""}`}
                onClick={() => setSelectedUser(user)}
              >
                {user.profileImagePath ? (
                  <img
                    src={`http://localhost:8080${user.profileImagePath}`}
                    alt={`Perfil de ${user.username}`}
                  />
                ) : (
                  <div className="adminUserAvatarFallback">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong>{user.username}</strong>
                  <span>{user.organizationName || "Sin organización"}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedUser && (
            <div className="adminGoalsPanel">
              <header>
                <h2>{selectedUser.username}</h2>
                <p>Resumen de goals del usuario subordinado seleccionado.</p>
              </header>

              {isLoadingAdminGoals ? (
                <p className="adminHomeEmptyState">Cargando estadísticas...</p>
              ) : (
                <AdminGoalsStats goals={selectedUserGoals} />
              )}
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
