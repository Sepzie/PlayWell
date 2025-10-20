import { Chart as ChartJS } from "chart.js/auto"
import { number } from "framer-motion";
import { useEffect } from "react";
import { Bar } from "react-chartjs-2"

function HistoryBarChart(){
    const playTimeList = {months: [], timePlayed: []};
    populateList(playTimeList);
    const data = {
        labels: playTimeList.months,
            datasets: [
              {
                label: "Time Played (Minutes)",
                data: playTimeList.timePlayed,
                borderRadius: 5,
                barThickness: 30,
              },
            ],
    }

    const options = {
        maintainAspectRatio: false
    }

    const config = {
      type: 'bar',
      data: data,
      options: options
    }

    let barChart;

    useEffect(() => {
      let ctx = document.getElementById('bar-chart').getContext('2d');
      if (barChart) {
        barChart.destroy();
      }
      barChart = new ChartJS(ctx, config);
    }, [])

    const updateList = () => {
      populateList(playTimeList);
      barChart.update();
    }

    return (
      <div id="history-bar-chart">
        <button onClick={() => updateList()}>Update Data</button>
        <canvas id="bar-chart"></canvas>
      </div>
      
  );
}

function populateList(playTimeList) {
    playTimeList.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 0; i < 12; i++) {
        playTimeList.timePlayed[i] = Math.round(Math.random() * 400);
    }
}



export default HistoryBarChart;