import React, { useEffect, useState } from 'react';
import "/src/css/Home.css";
import { Chart as ChartJS } from "chart.js/auto"
import { Bar } from "react-chartjs-2"
import Top3GamesBarChart from '/src/components/Top3GamesBarChart';
import { formatMinutesToHoursMinutes } from '../utils/timeFormatter';

function Home() {
  const [totalPlaytime, setTotalPlaytime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch today's stats
  const fetchTodayStats = async () => {
    try {
      setIsLoading(true);
      const stats = await window.electronAPI.getGameStats({ period: 'today' });

      // Calculate total playtime across all games
      const total = stats.reduce((sum, game) => sum + game.playTime, 0);
      setTotalPlaytime(total);
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
      setTotalPlaytime(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTodayStats();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTodayStats();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="page">
      <h1 className="page-header">Home</h1>
      <div className="hours-played">
        <p>You have played for...</p>
        <h2>
          {isLoading ? 'Loading...' : formatMinutesToHoursMinutes(totalPlaytime)}
        </h2>
        <p>today</p>
      </div>
      <Top3GamesBarChart id="home-bar-chart" />
    </div>
  );
}

export default Home;


