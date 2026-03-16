import React from "react";

const HomeHeader = () => {
  return (
    <>
      <div className="personalHeader">
        <h1>Nice to see you, {localStorage.getItem("username")}</h1>
      </div>

      <div className="dashboardHeader">
        <h1>Dashboard</h1>
      </div>
    </>
  );
};

export default HomeHeader;
