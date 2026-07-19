// theme.js
// Handles switching between light and dark mode.
// Same mechanism as before: the chosen theme is saved in localStorage
// so it stays the same next time the user opens the site.
// Only change: the default is now "dark" (to match the new look),
// and the toggle button gets a small spin animation on click.

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

// Apply the theme as early as possible to avoid a flash of the wrong theme
applyStoredTheme();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});
