
let categories = { income: [], expense: [] };
let currentType = "expense";
let historyChart;
let balanceHidden = false;
let lastBalanceValue = 0;
let lastMonthlyHistory = [];

document.addEventListener("fintrace-theme-change", () => {
  if (lastMonthlyHistory.length) renderHistoryChart(lastMonthlyHistory);
});

function currentMonthString() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

async function init() {
  const user = await requireAuth();
  if (!user) return;
  applyGreeting(user);
  wireTopSearch();

  categories = await apiRequest("/api/categories");
  populateCategorySelect();

  document.getElementById("dateInput").value = new Date().toISOString().slice(0, 10);
  document.getElementById("monthPicker").value = currentMonthString();

  document.getElementById("monthPicker").addEventListener("change", loadSummary);
  document.getElementById("saveGoalBtn").addEventListener("click", saveGoal);
  document.getElementById("quickAddForm").addEventListener("submit", addTransaction);
  document.getElementById("eyeToggle").addEventListener("click", toggleBalanceVisibility);

  document.querySelectorAll("#typeToggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      document.querySelectorAll("#typeToggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      populateCategorySelect();
    });
  });

  await loadSummary();
  await loadRecentTransactions();
}

function populateCategorySelect() {
  const select = document.getElementById("categorySelect");
  select.innerHTML = "";
  categories[currentType].forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function toggleBalanceVisibility() {
  balanceHidden = !balanceHidden;
  const el = document.getElementById("heroBalance");
  const icon = document.querySelector("#eyeToggle i");
  if (balanceHidden) {
    el.textContent = "₹ •••••••";
    icon.className = "bi bi-eye-slash";
  } else {
    el.textContent = formatMoney(lastBalanceValue);
    icon.className = "bi bi-eye";
  }
}

async function loadSummary() {
  const month = document.getElementById("monthPicker").value || currentMonthString();
  const summary = await apiRequest(`/api/summary?month=${month}`);

  document.getElementById("monthLabel").textContent = new Date(month + "-02").toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Hero balance (with count-up animation)
  lastBalanceValue = summary.balance;
  if (!balanceHidden) {
    animateValue(document.getElementById("heroBalance"), summary.balance, (v) => formatMoney(v));
  }

  animateValue(document.getElementById("heroIncome"), summary.income, (v) => formatMoney(v));
  animateValue(document.getElementById("heroExpense"), summary.expense, (v) => formatMoney(v));
  document.getElementById("heroGoal").textContent = formatMoney(summary.goal);

  animateValue(document.getElementById("statIncome"), summary.income, (v) => formatMoney(v));
  animateValue(document.getElementById("statExpense"), summary.expense, (v) => formatMoney(v));
  animateValue(document.getElementById("statSavingsRate"), summary.savingsRate, (v) => Math.round(v) + "%");

  renderChangeTag(summary);
  renderSparklines(summary.monthlyHistory);
  lastMonthlyHistory = summary.monthlyHistory;
  renderHistoryChart(summary.monthlyHistory);
  renderGoal(summary);
}

function renderChangeTag(summary) {
  const tag = document.getElementById("changeTag");
  const hist = summary.monthlyHistory;
  const prev = hist[hist.length - 2];
  const prevBalance = prev ? prev.income - prev.expense : 0;

  if (!prev || prevBalance === 0) {
    tag.style.display = "none";
    return;
  }
  const change = Math.round(((summary.balance - prevBalance) / Math.abs(prevBalance)) * 100);
  tag.style.display = "inline-block";
  tag.textContent = (change >= 0 ? "+" : "") + change + "%";
  tag.className = "change-tag " + (change >= 0 ? "positive" : "negative");
}

function renderSparklines(monthlyHistory) {
  const incomeValues = monthlyHistory.map((m) => m.income);
  const expenseValues = monthlyHistory.map((m) => m.expense);
  const savingsValues = monthlyHistory.map((m) => (m.income > 0 ? Math.max(0, ((m.income - m.expense) / m.income) * 100) : 0));

  renderSparkline("sparkIncome", incomeValues);
  renderSparkline("sparkExpense", expenseValues);
  renderSparkline("sparkSavings", savingsValues);
}

function renderSparkline(containerId, values) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const max = Math.max(...values, 1);

  values.forEach((v, i) => {
    const bar = document.createElement("div");
    bar.className = "bar" + (i === values.length - 1 ? " current" : "");
    container.appendChild(bar);
    requestAnimationFrame(() => {
      bar.style.height = Math.max(6, (v / max) * 100) + "%";
    });
  });
}

function renderHistoryChart(monthlyHistory) {
  const canvas = document.getElementById("historyChart");
  if (historyChart) historyChart.destroy();

  const labels = monthlyHistory.map((m) => new Date(m.month + "-02").toLocaleDateString("en-IN", { month: "short" }));
  const currentIndex = monthlyHistory.length - 1;

  const barColors = monthlyHistory.map((_, i) => (i === currentIndex ? cssVar("--accent") : cssVar("--surface-2")));
  const balances = monthlyHistory.map((m) => m.income - m.expense);

  historyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Net balance",
          data: balances,
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 46,
        },
      ],
    },
    options: {
      animation: { duration: 700, easing: "easeOutCubic" },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cssVar("--muted") }, grid: { display: false } },
        y: { ticks: { color: cssVar("--muted") }, grid: { color: cssVar("--border") } },
      },
    },
  });
}

function renderGoal(summary) {
  const statusEl = document.getElementById("goalStatus");
  const labels = { "on-track": "On track", behind: "Behind goal", "no-goal": "No goal set" };
  statusEl.textContent = labels[summary.status];
  statusEl.className = "goal-status " + summary.status;

  document.getElementById("goalSavedLabel").textContent = `Saved: ${formatMoney(Math.max(0, summary.balance))}`;
  document.getElementById("goalTargetLabel").textContent = `Goal: ${formatMoney(summary.goal)}`;
  document.getElementById("goalInput").value = summary.goal || "";

  const scale = document.getElementById("ledgerScale");
  scale.querySelectorAll(".tick, .ledger-marker").forEach((el) => el.remove());

  const max = Math.max(summary.goal, summary.balance, 1) * 1.15;
  const fillPercent = summary.goal > 0 ? Math.max(0, Math.min(100, (summary.balance / max) * 100)) : 0;
  document.getElementById("ledgerFill").style.width = fillPercent + "%";

  for (let i = 0; i <= 10; i++) {
    const tick = document.createElement("div");
    tick.className = "tick" + (i % 5 === 0 ? " major" : "");
    tick.style.left = i * 10 + "%";
    scale.appendChild(tick);
  }

  if (summary.goal > 0) {
    const markerPos = Math.min(96, (summary.goal / max) * 100);
    const marker = document.createElement("div");
    marker.className = "ledger-marker";
    marker.style.left = markerPos + "%";
    marker.textContent = "goal";
    scale.appendChild(marker);
  }

  const insight = document.getElementById("goalInsight");
  if (summary.goal === 0) {
    insight.innerHTML = `<i class="bi bi-info-circle-fill"></i><span>Set a goal above to start tracking progress.</span>`;
  } else if (summary.status === "on-track") {
    insight.innerHTML = `<i class="bi bi-check-circle-fill"></i><span>You're on track — ${formatMoney(summary.balance)} saved of ${formatMoney(summary.goal)}.</span>`;
  } else {
    const gap = summary.goal - summary.balance;
    insight.innerHTML = `<i class="bi bi-arrow-up-circle-fill"></i><span>${formatMoney(gap)} more needed to hit this month's goal.</span>`;
  }
}

async function loadRecentTransactions() {
  const transactions = await apiRequest("/api/transactions?sort=date_desc");
  const list = document.getElementById("recentList");
  const empty = document.getElementById("emptyState");
  const recent = transactions.slice(0, 5);

  empty.style.display = recent.length === 0 ? "block" : "none";
  list.innerHTML = recent.map((t) => txRowHTML(t, false)).join("");
}

async function addTransaction(e) {
  e.preventDefault();
  const errorText = document.getElementById("formError");
  errorText.textContent = "";

  try {
    await apiRequest("/api/transactions", "POST", {
      type: currentType,
      category: document.getElementById("categorySelect").value,
      amount: document.getElementById("amountInput").value,
      date: document.getElementById("dateInput").value,
      note: document.getElementById("noteInput").value,
    });
    document.getElementById("amountInput").value = "";
    document.getElementById("noteInput").value = "";
    showToast("Transaction added", "success");
    await loadSummary();
    await loadRecentTransactions();
  } catch (err) {
    errorText.textContent = err.message;
    showToast(err.message, "error");
  }
}

async function saveGoal() {
  const value = document.getElementById("goalInput").value;
  try {
    await apiRequest("/api/goal", "POST", { monthlyGoal: value });
    showToast("Savings goal updated", "success");
    await loadSummary();
  } catch (err) {
    showToast(err.message, "error");
  }
}

init();
