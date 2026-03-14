import React from "react";
import "./css/Home.css";
import PieChart from "./PieChart.jsx";
import HomeDailyCalendarWidget from "./HomeDailyCalendarWidget";
import TodayReminders from "./TodayReminders";
import useTodayEvents from "./useTodayEvents";

const Home = () => {
  const { events, refreshTodayEvents } = useTodayEvents();

  return (
    <>
      <div className="personalHeader">
        <h1>Nice to see you, {localStorage.getItem("username")}</h1>
      </div>

      <div className="dashboardHeader">
        <h1>Dashboard</h1>
      </div>

      <div className="homeHeroSection">
        <div className="homeHeroGrid">
          <div className="homeLeftColumn">
            <div className="chartSection">
              <div className="chartContainer">
                <PieChart />
              </div>
            </div>

            <TodayReminders events={events} />
          </div>

          <HomeDailyCalendarWidget
            events={events}
            onEventsChanged={refreshTodayEvents}
          />
        </div>
      </div>
    </>
  );
};

export default Home;
