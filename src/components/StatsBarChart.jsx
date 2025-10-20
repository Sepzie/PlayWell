import { Chart as ChartJS } from "chart.js/auto"
import { number } from "framer-motion";
import { Bar } from "react-chartjs-2"

function StatsBarChart(){
    const numberOfGames = 100;
    const gamesList = {names: [], timePlayed: []};
    getGames(gamesList, numberOfGames);
    const data = {
        labels: gamesList.names,
            datasets: [
              {
                label: "Time Played (Minutes)",
                data: gamesList.timePlayed,
                borderRadius: 5,
                barThickness: 30,
              },
            ],
    }

    const options = {
        indexAxis: 'y',
        maintainAspectRatio: false
    }

    return (
      <div id="history-bar-chart">
        <Bar
          data={data}
          options={options}
        />
      </div>
  );
}

function getGames(gamesList, numberOfGames) {
    for (let i = 0; i < numberOfGames; i++) {
        gamesList.names[i] = "Game " + (i + 1);
        gamesList.timePlayed[i] = Math.round(Math.random() * 400);
    }
}

export default StatsBarChart;