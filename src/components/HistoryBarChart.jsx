import { Chart as ChartJS } from "chart.js/auto"
import { number } from "framer-motion";
import { useEffect } from "react";
import { Bar } from "react-chartjs-2"

function HistoryBarChart(){
  // Setup current date
    const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let currentDateButton;
    let currentDateInput;
    let currentYearInput;

    let yearBreakdown = true;

    // Setup data for bar chart
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

    // Get canvas & create new bar chart on page load
    let barChart;
    let useEffectExecuted = false;
    useEffect(() => {
      let ctx = document.getElementById('bar-chart').getContext('2d');
      if (barChart) {
        barChart.destroy();
      }
      barChart = new ChartJS(ctx, config);
      
      // Update current date text
      currentDateButton = document.getElementById('current-date-button');
      currentDateButton.textContent = `${currentYear}`;

      currentDateInput = document.getElementById('date-input');
      currentYearInput = document.getElementById('year-input');
      currentDateInput.value = currentDate.getFullYear(currentYearInput);
      if (!useEffectExecuted) {
        addYearsInput(currentYearInput, currentDate);
      }
      useEffectExecuted = true;
    }, [])

    // Update list on button click
    const updateList = () => {
      populateList(playTimeList);
      barChart.update();
    }

    // Performed on clicking on the current date
    const showDatePicker = () => {
      if (yearBreakdown) {
        currentYearInput.showPicker();
      }
      else {
        currentDateInput.showPicker();
      }
    }

    // Updates the date with the chosen date in the date input value
    // Date is offset by one month, so nextDate() is called
    const updateDate = () => {
      if (yearBreakdown) {
        currentYear = currentYearInput.value;
        currentDateButton.textContent = `${currentYear}`;
        updateList();
      }

      else {
        currentDate = new Date(currentDateInput.value);
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
        nextDate();
      }
    }

    // Goes to the previous month & updates the current date text & bar chart
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

    // Goes to the next month & updates the current date text & bar chart
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
        <div id="buttons-holder">
          <button id="back-button" onClick={() => previousDate()}>&lt;</button>
          <div>
            <input type="month" id="date-input" onChange={() => updateDate()}></input>

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

function populateList(playTimeList) {
    // Add randomized data to list for bar chart
    playTimeList.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 0; i < 12; i++) {
        playTimeList.timePlayed[i] = Math.round(Math.random() * 400);
    }
}

function addYearsInput(currentYearInput, currentDate) {
  let minimumYear = 2025;
  let maximumYear = 2075;
  for (let i = minimumYear; i <= maximumYear; i++) {
    currentYearInput.innerHTML += `<option value='${i}'>${i}</option>`;
  }
  currentYearInput.value = currentDate.getFullYear();
}

export default HistoryBarChart;