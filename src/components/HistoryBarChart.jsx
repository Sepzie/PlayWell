import { Chart as ChartJS } from "chart.js/auto"
import { useEffect, useState, useRef } from "react";

function HistoryBarChart(){
    // Store names of months
    const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

    // State management
    const [currentDate, setCurrentDate] = useState(new Date());
    const [yearBreakdown, setYearBreakdown] = useState(true);
    const [chartData, setChartData] = useState({ labels: [], data: [] });
    const [isLoading, setIsLoading] = useState(true);

    // Refs for canvas and chart instance
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Fetch data from backend
    const fetchHistoryData = async () => {
        try {
            setIsLoading(true);

            const options = yearBreakdown
                ? {
                    period: 'year',
                    year: currentYear,
                    granularity: 'month'
                  }
                : {
                    period: 'specific-month',
                    year: currentYear,
                    month: currentMonth,
                    granularity: 'day'
                  };

            const data = await window.electronAPI.getHistoryData(options);
            setChartData(data);
            checkDateChangeButtons(options, data);
        } catch (error) {
            console.error('Error fetching history data:', error);
            setChartData({ labels: [], data: [] });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when date or breakdown changes
    useEffect(() => {
        fetchHistoryData();
    }, [currentDate, yearBreakdown]);

    // Create/update chart when data changes
    useEffect(() => {
        if (!canvasRef.current || isLoading) return;

        const ctx = canvasRef.current.getContext('2d');

        // Destroy existing chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        // Create new chart
        chartInstanceRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: "Time Played (Hours)",
                        data: chartData.data,
                        borderRadius: 5,
                        barThickness: 30,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false
            }
        });

        // Cleanup on unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [chartData, isLoading]);

    // Toggle yearly or monthly breakdown
    const toggleBreakdown = (breakdownBool) => {
        if (yearBreakdown === breakdownBool) {
            return;
        }

        // Reset to current date when switching views
        setCurrentDate(new Date());
        setYearBreakdown(breakdownBool);
    };

    // Navigate to previous period
    const previousDate = () => {
        const newDate = new Date(currentDate);
        if (yearBreakdown) {
            newDate.setFullYear(newDate.getFullYear() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    // Navigate to next period
    const nextDate = () => {
        const newDate = new Date(currentDate);
        if (yearBreakdown) {
            newDate.setFullYear(newDate.getFullYear() + 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    // Handle date picker change
    const handleDateChange = (e) => {
        if (yearBreakdown) {
            const newDate = new Date(currentDate);
            newDate.setFullYear(parseInt(e.target.value));
            setCurrentDate(newDate);
        } else {
            // Month input returns YYYY-MM format
            const newDate = new Date(e.target.value);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentDate(newDate);
        }
    };

    // Get display text for current date
    const getDateDisplayText = () => {
        if (yearBreakdown) {
            return `${currentYear}`;
        } else {
            return `${monthNames[currentMonth]} ${currentYear}`;
        }
    };

    // Get formatted date for inputs
    const getYearInputValue = () => currentYear;
    const getMonthInputValue = () => {
        // Format as YYYY-MM for month input
        const month = String(currentMonth + 1).padStart(2, '0');
        return `${currentYear}-${month}`;
    };

    const showDateSelector = () => {
      if (yearBreakdown) {
        document.getElementById("year-input").showPicker()
      }
      else {
        document.getElementById("month-input").showPicker()
      }
    }

    const checkDateChangeButtons = async (options, data) => {
      // Immediately disable buttons
      document.getElementById("back-button").disabled = true;
      document.getElementById("next-button").disabled = true;

      // References to previous, next & current date
      let previousYearData;
      let nextYearData;
      let currentYearData;

      // Get previous & next years
      let previousYear = currentYear - 1;
      let nextYear = currentYear + 1;

      // Only get yearly breakdown
      if (!yearBreakdown) {
        options.period = 'year';
        options.granularity = 'month';
      }

      // Get data from the current year
      currentYearData = await window.electronAPI.getHistoryData(options);

      // Get data from the previous year
      options.year = previousYear;
      previousYearData = await window.electronAPI.getHistoryData(options);

      // Get data from the next year
      options.year = nextYear;
      nextYearData = await window.electronAPI.getHistoryData(options);

      // Assume buttons will be disabled
      let disableBackButton = true;
      let disableNextButton = true;

      // Year Breakdown
      if (yearBreakdown) {
        // For previous year
        // Check each date for data
        for (let i = 0; i < previousYearData.data.length; i++) {
          // Set bool if there is any data
          if (previousYearData.data[i] > 0) {
            disableBackButton = false;
          }
        }

        // Same logic for previous year as next year
        disableNextButton = true;
        for (let i = 0; i < nextYearData.data.length; i++) {
          if (nextYearData.data[i] > 0) {
            disableNextButton = false;
          }
        }
      }

      // Month Breakdown
      else {
        // For previous month
        // Check previous year if previous month is december
        if ((currentMonth - 1) < 0) {
          for (let i = 0; i < previousYearData.data.length; i++) {
            if (previousYearData.data[i] > 0) {
              disableBackButton = false;
            }
          }
        }
        // Check current year for any other months
        else {
          for (let i = 0; i < currentMonth; i++) {
            if (currentYearData.data[i] > 0) {
              disableBackButton = false;
            }
          }
        }

        // For next month
        // Check next year if next month is January
        if ((currentMonth + 1) > (currentYearData.data.length - 1)) {
          for (let i = 0; i < nextYearData.data.length; i++) {
            if (nextYearData.data[i] > 0) {
              disableNextButton = false;
            }
          }
        }
        // Check current year for any other months
        else {
          for (let i = currentYearData.data.length; i > currentMonth; i--) {
            if (currentYearData.data[i] > 0) {
              disableNextButton = false;
            }
          }
        }
      }

      // Enable buttons if there is data
      if (!disableBackButton)
      {
        document.getElementById("back-button").disabled = false;
      }

      if (!disableNextButton)
        {
          document.getElementById("next-button").disabled = false;
      }

    }

    return (
      <div id="history-bar-chart-components">
        <div id="breakdown-toggle-buttons-container">
          <button
            id="year-breakdown-button"
            className={yearBreakdown ? 'active' : ''}
            onClick={() => toggleBreakdown(true)}
          >
            Yearly
          </button>
          <button
            id="month-breakdown-button"
            className={!yearBreakdown ? 'active' : ''}
            onClick={() => toggleBreakdown(false)}
          >
            Monthly
          </button>
        </div>

        <div id="date-buttons-container">
          <button id="back-button" onClick={previousDate}>&lt;</button>
          <div>
            {!yearBreakdown && (
              <input
                type="month"
                id="month-input"
                value={getMonthInputValue()}
                onChange={handleDateChange}
              />
            )}

            {yearBreakdown && (
              <select
                id="year-input"
                value={getYearInputValue()}
                onChange={handleDateChange}
              >
                {/* Generate year options from 2020 to current year + 5 */}
                {Array.from({ length: (new Date().getFullYear() + 5) - 2020 + 1 }, (_, i) => 2020 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}

            <button id="current-date-button" onClick={() => showDateSelector()}>
              {getDateDisplayText()}
            </button>
          </div>
          <button id="next-button" onClick={nextDate}>&gt;</button>
        </div>

        <div id="history-bar-chart">
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading history data...</p>
          ) : chartData.labels.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>No gaming data for this period.</p>
          ) : (
            <canvas ref={canvasRef} id="bar-chart"></canvas>
          )}
        </div>
      </div>
  );
}

export default HistoryBarChart;
