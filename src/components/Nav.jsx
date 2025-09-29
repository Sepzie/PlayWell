import React from 'react';
import { Link } from 'react-router-dom';

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <h2>PlayWell</h2>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/limits" className="nav-link">Limits</Link>
        <Link to="/stats" className="nav-link">Stats</Link>
        <Link to="/history" className="nav-link">History</Link>
        <Link to="/settings" className="nav-link">Settings</Link>
      </div>
    </nav>
  );
}

export default Nav;


