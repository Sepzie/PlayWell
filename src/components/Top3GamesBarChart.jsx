import React, { useEffect, useState } from 'react';
import { Chart as ChartJS } from "chart.js/auto"
import { Bar } from "react-chartjs-2"

function Top3GamesBarChart() {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                label: "Time Played (Minutes)",
                data: [],
                borderRadius: 5,
                barThickness: 30,
            },
        ],
    });

    const fetchTop3Games = async () => {
        try {
            const stats = await window.electronAPI.getGameStats({ period: 'today' });

            // Sort by playTime descending and take top 3
            const top3 = stats
                .sort((a, b) => b.playTime - a.playTime)
                .slice(0, 3);

            setChartData({
                labels: top3.map(game => game.name),
                datasets: [
                    {
                        label: "Time Played (Minutes)",
                        data: top3.map(game => game.playTime),
                        borderRadius: 5,
                        barThickness: 30,
                    },
                ],
            });
        } catch (error) {
            console.error('Error fetching top 3 games:', error);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchTop3Games();
    }, []);

    // Auto-refresh every 60 seconds to match Home component
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchTop3Games();
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const options = {
        indexAxis: 'y',
        maintainAspectRatio: false
    }

    return (
      <div id="home-bar-chart">
        <Bar
          data={chartData}
          options={options}
        />
      </div>
  );
}

export default Top3GamesBarChart;