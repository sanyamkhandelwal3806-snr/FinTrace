// server.js

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const INCOME_CATEGORIES = ["Salary", "Freelancing", "Business", "Investments", "Scholarship", "Pocket Money", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Health", "Bills", "Utilities", "Other"];


app.use(express.json()); // lets us read JSON bodies sent by fetch()
app.use(express.static(path.join(__dirname, "public"))); // serves login.html, dashboard.html, css/js, etc.

app.use(
  session({
    secret: "fintrace-learning-project-secret", // change this if you deploy publicly
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  })
);

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in first." });
  }
  next();
}

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (db.findUserByEmail(email)) {
    return res.status(400).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    monthlyGoal: 0, // how much the user wants to save each month
    createdAt: new Date().toISOString(),
  };

  const users = db.getUsers();
  users.push(newUser);
  db.saveUsers(users);

  req.session.userId = newUser.id;
  res.json({ id: newUser.id, name: newUser.name, email: newUser.email });
});

// Log in to an existing account
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.findUserByEmail(email || "");

  if (!user) {
    return res.status(400).json({ error: "No account found with that email." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(400).json({ error: "Incorrect password." });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email });
});

// Log out
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// Return the currently logged-in user (frontend uses this to check auth state)
app.get("/api/me", requireLogin, (req, res) => {
  const user = db.findUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not logged in." });
  res.json({ id: user.id, name: user.name, email: user.email, monthlyGoal: user.monthlyGoal });
});

// Send the category lists to the frontend so they only live in one place
app.get("/api/categories", (req, res) => {
  res.json({ income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES });
});

app.get("/api/transactions", requireLogin, (req, res) => {
  const { month, type, category, search, sort } = req.query;

  let results = db.getTransactions().filter((t) => t.userId === req.session.userId);

  if (month) results = results.filter((t) => t.date.startsWith(month));
  if (type) results = results.filter((t) => t.type === type);
  if (category) results = results.filter((t) => t.category === category);
  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (t) => (t.note || "").toLowerCase().includes(term) || t.category.toLowerCase().includes(term)
    );
  }

  switch (sort) {
    case "date_asc":
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case "amount_desc":
      results.sort((a, b) => b.amount - a.amount);
      break;
    case "amount_asc":
      results.sort((a, b) => a.amount - b.amount);
      break;
    default: // date_desc is the default (newest first)
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  res.json(results);
});

// Add a new income or expense transaction
app.post("/api/transactions", requireLogin, (req, res) => {
  const { type, category, amount, date, note } = req.body;

  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
  }
  const validCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: "Invalid category for this type." });
  }
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number." });
  }
  if (!date) {
    return res.status(400).json({ error: "Date is required." });
  }

  const newTransaction = {
    id: crypto.randomUUID(),
    userId: req.session.userId,
    type,
    category,
    amount: numericAmount,
    date, // stored as "YYYY-MM-DD"
    note: note || "",
    createdAt: new Date().toISOString(),
  };

  const transactions = db.getTransactions();
  transactions.push(newTransaction);
  db.saveTransactions(transactions);

  res.status(201).json(newTransaction);
});

// Edit an existing transaction
app.put("/api/transactions/:id", requireLogin, (req, res) => {
  const transactions = db.getTransactions();
  const index = transactions.findIndex((t) => t.id === req.params.id && t.userId === req.session.userId);

  if (index === -1) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  const { type, category, amount, date, note } = req.body;
  const existing = transactions[index];

  transactions[index] = {
    ...existing,
    type: type || existing.type,
    category: category || existing.category,
    amount: amount ? Number(amount) : existing.amount,
    date: date || existing.date,
    note: note !== undefined ? note : existing.note,
  };

  db.saveTransactions(transactions);
  res.json(transactions[index]);
});

// Delete a transaction
app.delete("/api/transactions/:id", requireLogin, (req, res) => {
  const transactions = db.getTransactions();
  const filtered = transactions.filter((t) => !(t.id === req.params.id && t.userId === req.session.userId));

  if (filtered.length === transactions.length) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  db.saveTransactions(filtered);
  res.json({ ok: true });
});


app.get("/api/summary", requireLogin, (req, res) => {
  const user = db.findUserById(req.session.userId);
  const month = req.query.month || new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const allUserTransactions = db.getTransactions().filter((t) => t.userId === req.session.userId);
  const monthTransactions = allUserTransactions.filter((t) => t.date.startsWith(month));

  const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const goal = user.monthlyGoal || 0;
  const goalProgressPercent = goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;

  let status = "no-goal";
  if (goal > 0) {
    status = balance >= goal ? "on-track" : "behind";
  }

  // Which expense category has the user spent the most on this month?
  const categoryTotals = {};
  monthTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
  let topCategory = null;
  let topCategoryAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amt;
    }
  }

  // Build the last 6 months of income vs expense, for the analytics bar chart
  const monthlyHistory = [];
  const [year, mon] = month.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, mon - 1 - i, 1);
    const key = d.toISOString().slice(0, 7);
    const monthTx = allUserTransactions.filter((t) => t.date.startsWith(key));
    monthlyHistory.push({
      month: key,
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }

  res.json({
    month,
    income,
    expense,
    balance,
    savingsRate,
    goal,
    goalProgressPercent,
    status,
    topCategory,
    topCategoryAmount,
    categoryTotals,
    monthlyHistory,
  });
});


app.post("/api/goal", requireLogin, (req, res) => {
  const { monthlyGoal } = req.body;
  const numericGoal = Number(monthlyGoal);

  if (isNaN(numericGoal) || numericGoal < 0) {
    return res.status(400).json({ error: "Goal must be a positive number." });
  }

  const users = db.getUsers();
  const index = users.findIndex((u) => u.id === req.session.userId);
  users[index].monthlyGoal = numericGoal;
  db.saveUsers(users);

  res.json({ monthlyGoal: numericGoal });
});


app.get("/api/export", requireLogin, (req, res) => {
  const transactions = db
    .getTransactions()
    .filter((t) => t.userId === req.session.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const header = "Date,Type,Category,Amount,Note\n";
  const rows = transactions
    .map((t) => `${t.date},${t.type},${t.category},${t.amount},"${(t.note || "").replace(/"/g, '""')}"`)
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=fintrace-transactions.csv");
  res.send(header + rows);
});


app.listen(PORT, () => {
  console.log(`FINTRACE is running at http://localhost:${PORT}`);
});
