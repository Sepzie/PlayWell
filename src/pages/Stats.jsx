import React from 'react';
import StatsTable from '/src/components/StatsTable.jsx';
import "/src/css/Stats.css";

function Stats() {
  return (
    <div className="page">
      <h1>Stats</h1>
      <p>View your gaming statistics and insights</p>
      <div id="stats-table-root">
        <StatsTable/>
      </div>
    </div>
  );
}

export default Stats;


