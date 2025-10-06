import { Chart as ChartJS } from "chart.js/auto"
import { Bar } from "react-chartjs-2"

function Top3GamesBarChart() {
  
    const data = {
        labels: ["Game 1", "Game 2", "Game 3"],
            datasets: [
              {
                label: "Time Played (Minutes)",
                data: [400, 300, 80],
                borderRadius: 5,
                barThickness: 30,
              },
            ],
    }

    const options = {
        indexAxis: 'y',
    }
    
    return (
      <div className="bar-chart">
        <Bar
          data={data}
          options={options}
        />
      </div>
  );
}

export default Top3GamesBarChart;