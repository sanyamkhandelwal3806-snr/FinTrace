// analytics.js - powers analytics.html

let categoryChart, historyChart;
let lastSummary = null;
const palette = ["#e3c17e", "#6fcf97", "#4a90d9", "#ea8a83", "#a78bd6", "#8d8f95", "#f0a860"];

document.addEventListener("fintrace-theme-change", () => {
  if (lastSummary) {
    drawCategoryChart(lastSummary.categoryTotals);
    drawHistoryChart(lastSummary.monthlyHistory);
  }
});

function currentMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

async function init() {
  const user = await requireAuth();
  if (!user) return;
  applyGreeting(user);
  wireTopSearch();

  document.getElementById("monthPicker").value = currentMonthString();
  document.getElementById("monthPicker").addEventListener("change", loadCharts);

  await loadCharts();
}

async function loadCharts() {
  const month = document.getElementById("monthPicker").value || currentMonthString();
  const summary = await apiRequest(`/api/summary?month=${month}`);

  document.getElementById("monthLabel").textContent = new Date(month + "-02").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  lastSummary = summary;
  drawCategoryChart(summary.categoryTotals);
  drawHistoryChart(summary.monthlyHistory);
}

function drawCategoryChart(categoryTotals) {
  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const emptyState = document.getElementById("categoryEmpty");
  const canvas = document.getElementById("categoryChart");

  if (categoryChart) categoryChart.destroy();

  if (labels.length === 0) {
    emptyState.style.display = "block";
    canvas.style.display = "none";
    return;
  }
  emptyState.style.display = "none";
  canvas.style.display = "block";

  categoryChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: palette, borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      animation: { duration: 700, easing: "easeOutCubic" },
      plugins: {
        legend: { position: "bottom", labels: { color: cssVar("--ink"), font: { family: "Plus Jakarta Sans" }, boxWidth: 12, padding: 14 } },
      },
    },
  });
}

function drawHistoryChart(monthlyHistory) {
  const canvas = document.getElementById("historyChart");
  if (historyChart) historyChart.destroy();

  const labels = monthlyHistory.map((m) => new Date(m.month + "-02").toLocaleDateString("en-IN", { month: "short" }));

  historyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Income", data: monthlyHistory.map((m) => m.income), backgroundColor: cssVar("--positive"), borderRadius: 6, maxBarThickness: 30 },
        { label: "Expenses", data: monthlyHistory.map((m) => m.expense), backgroundColor: cssVar("--negative"), borderRadius: 6, maxBarThickness: 30 },
      ],
    },
    options: {
      animation: { duration: 700, easing: "easeOutCubic" },
      scales: {
        x: { ticks: { color: cssVar("--muted") }, grid: { display: false } },
        y: { ticks: { color: cssVar("--muted") }, grid: { color: cssVar("--border") } },
      },
      plugins: {
        legend: { position: "bottom", labels: { color: cssVar("--ink"), font: { family: "Plus Jakarta Sans" }, boxWidth: 12, padding: 14 } },
      },
    },
  });
}

init();
