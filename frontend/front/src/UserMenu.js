
import React, {useState} from "react";

import { useNavigate } from "react-router-dom"
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import './css/UserMenu.css';

function UserMenu(){

const [userMenuIsOpen,setUserMenuIsOpen] = useState(false);
const navigate = useNavigate();
const username = localStorage.getItem("username") || "User";
console.log("Rendering UserMenu in Home");

const handleLogout = () => {

  localStorage.removeItem("token");
  localStorage.removeItem("username");

  navigate("/");
};



// Dentro del componente UserMenu
const location = useLocation();

useEffect(() => {
  setUserMenuIsOpen(false); // Cierra el menú al cambiar de ruta
}, [location]);

const redirectSettings = () => {
   navigate("/settings");
}



         return (
             <div className="userMenuFrame">
      <div onClick={() => setUserMenuIsOpen(!userMenuIsOpen)} className="userIcon">
        {username}
      </div>

      {userMenuIsOpen && (
        <div className="userMenuPop">
          {/* Settings */}
          <Link
            to="/settings"
            className="menuItem"
            onClick={() => setUserMenuIsOpen(false)}
          >
            <i className="fa fa-cog"></i>
            <span>Settings</span>
          </Link>

          {/* Sign Out */}
          <div className="menuItem logout" onClick={handleLogout}>
            <i className="fa fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </div>
        </div>
      )}
    </div>
  );
}
    
  


export default UserMenu;

           







