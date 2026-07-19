// shared.js
// Small helpers used by more than one page, so they only need to be
// written once: category -> icon lookup, money/date formatting,
// a count-up number animation, and the HTML for one transaction row.

const CATEGORY_ICONS = {
  Salary: "bi-cash-stack",
  Freelancing: "bi-laptop",
  Business: "bi-briefcase-fill",
  Investments: "bi-graph-up-arrow",
  Scholarship: "bi-mortarboard-fill",
  "Pocket Money": "bi-wallet2",
  Food: "bi-cup-hot-fill",
  Travel: "bi-airplane-fill",
  Shopping: "bi-bag-fill",
  Education: "bi-book-fill",
  Entertainment: "bi-film",
  Health: "bi-heart-pulse-fill",
  Bills: "bi-receipt",
  Utilities: "bi-lightning-charge-fill",
  Other: "bi-three-dots",
};

function categoryIcon(category) {
  return CATEGORY_ICONS[category] || "bi-tag-fill";
}

function formatMoney(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Animates a number counting up (or down) to its final value.
// formatter turns the raw number into the text shown on screen at each frame.
function animateValue(el, endValue, formatter, duration = 700) {
  const startValue = 0;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out
    const current = startValue + (endValue - startValue) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Builds the HTML for one transaction row. Pass withActions=true to
// include edit/delete buttons (used on the transactions page but not
// in the dashboard's "recent" preview list).
function txRowHTML(t, withActions) {
  const icon = categoryIcon(t.category);
  const isIncome = t.type === "income";
  const tintBg = isIncome ? "color-mix(in srgb, var(--positive) 16%, transparent)" : "color-mix(in srgb, var(--negative) 16%, transparent)";
  const tintColor = isIncome ? "var(--positive)" : "var(--negative)";
  const sign = isIncome ? "+" : "−";
  const colorClass = isIncome ? "positive" : "negative";

  const actions = withActions
    ? `<div class="tx-row-actions">
         <button class="icon-btn" title="Edit" data-action="edit" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
         <button class="icon-btn" title="Delete" data-action="delete" data-id="${t.id}"><i class="bi bi-trash"></i></button>
       </div>`
    : "";

  return `
    <div class="tx-row">
      <div class="tx-icon" style="background:${tintBg}; color:${tintColor};"><i class="bi ${icon}"></i></div>
      <div class="tx-info">
        <div class="tx-cat">${t.category}</div>
        <div class="tx-note">${t.note || "No note"}</div>
      </div>
      <div class="tx-meta">
        <div class="tx-amount ${colorClass}">${sign} ${formatMoney(t.amount)}</div>
        <div class="tx-date">${formatDate(t.date)}</div>
      </div>
      ${actions}
    </div>
  `;
}

// Wires up the search pill in the topbar: pressing Enter jumps to the
// transactions page with the search term pre-filled.
function wireTopSearch() {
  const input = document.getElementById("topSearch");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      window.location.href = "/transactions.html?search=" + encodeURIComponent(input.value.trim());
    }
  });
}

// Fills in the avatar initial + greeting (time of day + first name).
function applyGreeting(user) {
  const first = user.name.split(" ")[0];
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const navUser = document.getElementById("navUser");
  if (navUser) navUser.textContent = user.name;

  const avatarInitial = document.getElementById("avatarInitial");
  if (avatarInitial) avatarInitial.textContent = first.charAt(0).toUpperCase();

  const greetingTime = document.getElementById("greetingTime");
  const greetingName = document.getElementById("greetingName");
  if (greetingTime) greetingTime.textContent = timeOfDay;
  if (greetingName) greetingName.textContent = first;
}
