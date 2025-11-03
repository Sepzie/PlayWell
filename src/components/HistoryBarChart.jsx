import { Chart as ChartJS } from "chart.js/auto"
import { number } from "framer-motion";
import { useEffect } from "react";
import { Bar } from "react-chartjs-2"

function HistoryBarChart(){
    // Store names of months
    const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

    // Setup current date
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // To store inputs & date button
    let currentDateButton;
    let currentMonthYearInput;
    let currentYearInput;

    // To be toggled to show playtime breakdowns by year or by month
    let yearBreakdown = true;

    // Setup data for bar chart by year
    const playTimeList = {dates: [], timePlayed: []};
    populateList(playTimeList, yearBreakdown);

    const data = {
        labels: playTimeList.dates,
            datasets: [
              {
                label: "Time Played (Minutes)",
                data: playTimeList.timePlayed,
                borderRadius: 5,
                barThickness: 30,
              },
            ],
    }
    
    // Add options for bar chart
    const options = {
        maintainAspectRatio: false
    }

    // Bar chart configuration when it is created
    const config = {
      type: 'bar',
      data: data,
      options: options
    }

    let barChart; // Store bar chart here
    let useEffectExecuted = false; // Some functions need to be executed once only
    useEffect(() => {
      // Get canvas & create bar chart in it
      // Destroy any existing bar charts
      let ctx = document.getElementById('bar-chart').getContext('2d');
      if (barChart) {
        barChart.destroy();
      }
      barChart = new ChartJS(ctx, config);
      
      // Update current date text
      currentDateButton = document.getElementById('current-date-button');
      currentDateButton.textContent = `${currentYear}`;

      // Store date inputs
      currentMonthYearInput = document.getElementById('month-input');
      currentYearInput = document.getElementById('year-input');
      currentMonthYearInput.value = currentDate.getFullYear(currentYearInput);
      currentYearInput.value = currentYear;

      // Add years dynamically to input
      if (!useEffectExecuted) {
        addYearsInput(currentYearInput, currentDate);
      }

      // Stop above function from executing twice
      useEffectExecuted = true;
    }, [])

    // Update list depending on the current breakdown
    const updateList = () => {
      populateList(playTimeList, yearBreakdown);
      barChart.data.labels = playTimeList.dates;
      barChart.update();
    }

    // Toggle yearly or monthly breakdown
    const toggleBreakdown = (breakdownBool) => {
      // Do nothing if the breakdown doesn't change
      // ex. yearBreakdown is true and Yearly button is pressed
      if (yearBreakdown == breakdownBool) {
        return
      }

      // Set current date if breakdown changes
      currentDate = new Date();
      currentMonth = currentDate.getMonth();
      currentYear = currentDate.getFullYear();
      
      // Set breakdown
      yearBreakdown = breakdownBool
      
      // Update text depending on the breakdown
      if (yearBreakdown) {
        currentDateButton.textContent = `${currentYear}`
      }
      else {
        currentDateButton.textContent = `${monthNames[currentMonth]} ${currentYear}`
      }

      // Update list afterwards
      updateList();
    }

    // Performed on clicking on the current date
    // Shows options to the user
    const showDatePicker = () => {
      if (yearBreakdown) {
        currentYearInput.showPicker();
      }
      else {
        currentMonthYearInput.showPicker();
      }
    }

    // Updates the date with the chosen date in the date input value
    const updateDate = () => {
      if (yearBreakdown) {
        currentYear = currentYearInput.value;
        currentDateButton.textContent = `${currentYear}`;
        updateList();
      }

      else {
        currentDate = new Date(currentMonthYearInput.value);
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
        nextDate(); // Date is offset by one month, so nextDate() is called
      }
    }

    // Goes to the previous year / month & updates the current date text & bar chart
    const previousDate = () => {
      if (yearBreakdown) {
        currentYear--;
        currentDateButton.textContent = `${currentYear}`;
        currentYearInput.value = currentYear;
        updateList();
      }

      else {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        currentDateButton.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        updateList();
      }
      
    }

    // Goes to the next year / month & updates the current date text & bar chart
    const nextDate = () => {
      if (yearBreakdown) {
        currentYear++;
        currentDateButton.textContent = `${currentYear}`;
        currentYearInput.value = currentYear;
        updateList();
      }

      else {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        currentDateButton.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        updateList();
      }
    }

    return (
      <div id="history-bar-chart-components">
        <div id="breakdown-toggle-buttons-container">
          <button id="year-breakdown-button" onClick ={() => toggleBreakdown(true)}>Yearly</button>
          <button id="month-breakdown-button" onClick={() => toggleBreakdown(false)}>Monthly</button>
        </div>
        <div id="date-buttons-container">
          <button id="back-button" onClick={() => previousDate()}>&lt;</button>
          <div>
            <input type="month" id="month-input" onChange={() => updateDate()}></input>

            <select id="year-input" min="2025" max="2075" onChange={() => updateDate()}>

            </select>
            <button id="current-date-button" onClick={() => showDatePicker()}>Update Data</button>
          </div>
          <button id="next-button" onClick={() => nextDate()}>&gt;</button>
        </div>

        <div id="history-bar-chart">
          <canvas id="bar-chart"></canvas>
        </div>
      </div>
      
  );
}

function populateList(playTimeList, yearBreakdown) {
    // Add randomized data to list for bar chart
    // Year breakdown has all 12 months
    if (yearBreakdown) {
      playTimeList.dates = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      for (let i = 0; i < 12; i++) {
          playTimeList.timePlayed[i] = Math.round(Math.random() * 400);
      }
    }

    // Month breakdown currently has 4 weeks
    else {
      playTimeList.dates = ["Week 1", "Week 2", "Week 3", "Week 4"]
      for (let i = 0; i < 4; i++) {
        playTimeList.timePlayed[i] = Math.round(Math.random() * 400);
      }
    }
    
}


function addYearsInput(currentYearInput, currentDate) {
  // Add years to yearInput depending on the min & max year
  let minimumYear = 2025;
  let maximumYear = 2075;
  for (let i = minimumYear; i <= maximumYear; i++) {
    currentYearInput.innerHTML += `<option value='${i}'>${i}</option>`;
  }
  currentYearInput.value = currentDate.getFullYear();
}

export default HistoryBarChart;