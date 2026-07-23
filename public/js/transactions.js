
let categories = { income: [], expense: [] };
let currentType = "expense"; // for the "add transaction" form
let editType = "expense"; // for the edit modal

async function init() {
  const user = await requireAuth();
  if (!user) return;
  applyGreeting(user);
  wireTopSearch();

  categories = await apiRequest("/api/categories");
  populateCategorySelect("categorySelect", currentType);
  populateFilterCategoryOptions();

  document.getElementById("dateInput").value = new Date().toISOString().slice(0, 10);

  // If we arrived here via the topbar search (e.g. /transactions.html?search=food),
  // pre-fill the search box and filter immediately.
  const params = new URLSearchParams(window.location.search);
  const searchFromUrl = params.get("search");
  if (searchFromUrl) document.getElementById("searchInput").value = searchFromUrl;

  document.querySelectorAll("#typeToggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      document.querySelectorAll("#typeToggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      populateCategorySelect("categorySelect", currentType);
    });
  });

  document.getElementById("addForm").addEventListener("submit", addTransaction);
  document.getElementById("searchInput").addEventListener("input", debounce(loadTransactions, 250));
  document.getElementById("filterType").addEventListener("change", loadTransactions);
  document.getElementById("filterCategory").addEventListener("change", loadTransactions);
  document.getElementById("filterMonth").addEventListener("change", loadTransactions);
  document.getElementById("sortSelect").addEventListener("change", loadTransactions);

  document.getElementById("editForm").addEventListener("submit", saveEdit);
  document.getElementById("cancelEdit").addEventListener("click", closeModal);

  await loadTransactions();
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function populateCategorySelect(selectId, type) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";
  categories[type].forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function populateFilterCategoryOptions() {
  const select = document.getElementById("filterCategory");
  const all = [...categories.income, ...categories.expense];
  const unique = [...new Set(all)];
  unique.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

async function loadTransactions() {
  const params = new URLSearchParams();
  const search = document.getElementById("searchInput").value.trim();
  const type = document.getElementById("filterType").value;
  const category = document.getElementById("filterCategory").value;
  const month = document.getElementById("filterMonth").value;
  const sort = document.getElementById("sortSelect").value;

  if (search) params.set("search", search);
  if (type) params.set("type", type);
  if (category) params.set("category", category);
  if (month) params.set("month", month);
  if (sort) params.set("sort", sort);

  const transactions = await apiRequest("/api/transactions?" + params.toString());
  renderList(transactions);
}

function renderList(transactions) {
  const list = document.getElementById("txList");
  const empty = document.getElementById("emptyState");
  empty.style.display = transactions.length === 0 ? "block" : "none";

  list.innerHTML = transactions.map((t) => txRowHTML(t, true)).join("");

  list.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = transactions.find((tx) => tx.id === btn.dataset.id);
      if (t) openEditModal(t);
    });
  });
  list.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteTransaction(btn.dataset.id));
  });
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
    await loadTransactions();
  } catch (err) {
    errorText.textContent = err.message;
    showToast(err.message, "error");
  }
}

function openEditModal(t) {
  editType = t.type;
  document.getElementById("editId").value = t.id;
  populateCategorySelect("editCategory", editType);
  document.getElementById("editCategory").value = t.category;
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editDate").value = t.date;
  document.getElementById("editNote").value = t.note || "";
  document.getElementById("editModal").classList.add("open");
}

function closeModal() {
  document.getElementById("editModal").classList.remove("open");
}

async function saveEdit(e) {
  e.preventDefault();
  const id = document.getElementById("editId").value;

  try {
    await apiRequest(`/api/transactions/${id}`, "PUT", {
      category: document.getElementById("editCategory").value,
      amount: document.getElementById("editAmount").value,
      date: document.getElementById("editDate").value,
      note: document.getElementById("editNote").value,
    });
    closeModal();
    showToast("Transaction updated", "success");
    await loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteTransaction(id) {
  if (!confirm("Delete this transaction? This cannot be undone.")) return;
  try {
    await apiRequest(`/api/transactions/${id}`, "DELETE");
    showToast("Transaction deleted", "success");
    await loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
}

init();
