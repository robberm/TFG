import React from 'react';
import { useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import './css/MainLayout.css';
import { Link } from 'react-router-dom'; 

const MainLayout = ({ children }) => {
  const location = useLocation();
  
  // Solo mostrar sidebar en rutas protegidas (no en login)
  const showSidebar = location.pathname !== '/';

  if (!showSidebar) {
    return children; // Solo mostrar el contenido en la página de login
  }

  return (
    <div className="homeFrame">
      {/* Sidebar - Menú lateral */}
      <div className="sideBar">
        <div className="menuHeader">
          <h3>Menu</h3>
        </div>
        <nav className="menuItems">
          <Link to="/home">
          
              <i className="fa fa-home"></i> &nbsp; Home
           
          </Link>
          <Link to="/calendar">
            
              <i className="fa fa-calendar"></i>&nbsp; Calendar
            
          </Link>
          <Link to="/objectives">
           
              <i className="fa fa-bullseye"></i>&nbsp; Objectives{" "}
              {/*&nbsp;  es un espacio en blanco */}
            
          </Link>
          <Link to="/block">
            
              <i className="fa fa-bullseye"></i>&nbsp; Block{" "}
              {/*&nbsp;  es un espacio en blanco */}
            
          </Link>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="mainContent">
        <div className="userMenuContainer">
          <UserMenu />
        </div>
        <div className="pageContent">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;