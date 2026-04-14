import React from "react";
import "../css/Home.css";
import PieChart from "../PieChart.jsx";
import HomeHeader from "../features/home/HomeHeader.jsx";
import DailyWidget from "../features/home/DailyWidget.jsx";
import RemindersPanel from "../features/home/RemindersPanel.js";
import useTodayEvents from "../hooks/useTodayEvents.jsx";

const Home = () => {
  const { todayEvents, refreshTodayEvents, isLoadingTodayEvents } =
    useTodayEvents();

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
