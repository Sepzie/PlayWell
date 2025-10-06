import React from 'react';
import "/src/css/Home.css";
import { Chart as ChartJS } from "chart.js/auto"
import { Bar } from "react-chartjs-2"

function Home() {
  return (
    <div className="page">
      <h1 className="page-header">Home</h1>
      <div className="hours-played">
        <p>You have played for...</p>
        <h2>13 Hours</h2>
        <p>today</p>
      </div>
      <div className="bar-chart">
        <Bar
          data={{
            labels: ["Game 1", "Game 2", "Game 3"],
            datasets: [
              {
                label: "Time Played (Minutes)",
                data: [400, 300, 80],
                borderRadius: 5,
                barThickness: 30,
              },
            ],
            
          }}
          options={{
            indexAxis: 'y',
          }}
        />
      </div>
    </div>
  );
}

export default Home;


