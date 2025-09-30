import React from 'react';
import { Outlet } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import "/src/css/App.css"

function App() {
  return (
    <div className="app">
      <div id="nav">
        <Nav />
      </div>
      <div className="main-content">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;

