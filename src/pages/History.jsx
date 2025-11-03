import React from 'react';
import HistoryBarChart from '/src/components/HistoryBarChart.jsx';
import "/src/css/History.css";

function History() {
  return (
    <div className="page">
      <h1>History</h1>
      <div id="history-bar-chart-root">
        <HistoryBarChart/>
      </div>
    </div>
  );
}

export default History;


