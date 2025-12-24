import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import "/src/css/Nav.css"
import logoUrl from '../public/temp-playwell-logo.png';

function Nav() {
  const location = useLocation().pathname;
  return (
    <nav className="nav">
      <div className="nav-brand">
        <img src={logoUrl} id="logo" alt="PlayWell"></img>
      </div>
      <div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-link" id={location == "/" ? "current-location" : ""}>HOME</Link></li>
          <li><Link to="/limits" className="nav-link" id={location == "/limits" ? "current-location" : ""}>LIMITS</Link></li>
          <li><Link to="/stats" className="nav-link" id={location == "/stats" ? "current-location" : ""}>STATS</Link></li>
          <li><Link to="/history" className="nav-link" id={location == "/history" ? "current-location" : ""}>HISTORY</Link></li>
          <li><Link to="/settings" className="nav-link" id={location == "/settings" ? "current-location" : ""}>SETTINGS</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Nav;


