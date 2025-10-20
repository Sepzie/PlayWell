import React from 'react';
import HistoryBarChart from '/src/components/HistoryBarChart.jsx';
import "/src/css/History.css";

function History() {
  return (
    <div className="page">
      <h1>History</h1>
      <p>View your gaming session history</p>
      <div id="history-bar-chart-container">
        <HistoryBarChart/>
      </div>
    </div>
  );
}

export default History;


