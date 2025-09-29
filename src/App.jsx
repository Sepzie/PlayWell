import React from 'react';
import { Outlet } from 'react-router-dom';
import Nav from './components/Nav.jsx';

function App() {
  return (
    <div className="app">
      <Nav />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;

