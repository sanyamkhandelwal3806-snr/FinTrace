
function applyStoredTheme() {
  const saved = localStorage.getItem("fintrace-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateToggleIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("fintrace-theme", next);
  updateToggleIcon(next);

  // Let any charts on the page know they should redraw with new colors
  document.dispatchEvent(new CustomEvent("fintrace-theme-change", { detail: { theme: next } }));

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.classList.remove("spin-once");
    void btn.offsetWidth; // restart the animation if clicked again quickly
    btn.classList.add("spin-once");
  }
}

function updateToggleIcon(theme) {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const icon = btn.querySelector("i");
  const target = icon || btn;
  target.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
}

applyStoredTheme();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});
