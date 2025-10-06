import React from 'react';
import "/src/css/Home.css";
import { Chart as ChartJS } from "chart.js/auto"
import { Bar } from "react-chartjs-2"
import Top3GamesBarChart from '/src/components/Top3GamesBarChart';

function Home() {
  return (
    <div className="page">
      <h1 className="page-header">Home</h1>
      <div className="hours-played">
        <p>You have played for...</p>
        <h2>13 Hours</h2>
        <p>today</p>
      </div>
      <Top3GamesBarChart />
    </div>
  );
}

export default Home;


