import React from 'react';
import "/src/css/Settings.css";

function Settings() {
  const handleExit = () => {
    window.electronAPI.exitApp();
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      <p>Configure your PlayWell preferences</p>
      <div className='centered-h'>
        <button className='exit-button' onClick={handleExit}>Exit App</button>
      </div>
    </div>
  );
}

export default Settings;


