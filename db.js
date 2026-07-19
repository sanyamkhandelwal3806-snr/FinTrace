// db.js
// -----------------------------------------------------------------------
// FINTRACE does not use a real database engine (like MongoDB or MySQL).
// Instead, it stores everything in two simple JSON files inside /data.
// This is the EASIEST way to understand how a "database" works, because
// you can literally open the files and read the data yourself.
//
// In a bigger real-world app you would swap this file for a proper
// database, but every function call in server.js would stay the same.
// -----------------------------------------------------------------------

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");

// Make sure the data folder + files exist before we try to read them.
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  if (!fs.existsSync(TRANSACTIONS_FILE)) fs.writeFileSync(TRANSACTIONS_FILE, "[]");
}
ensureDataFiles();

// --- Generic helpers ----------------------------------------------------

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw || "[]");
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Users ---------------------------------------------------------------

function getUsers() {
  return readJSON(USERS_FILE);
}

function saveUsers(users) {
  writeJSON(USERS_FILE, users);
}

function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return getUsers().find((u) => u.id === id);
}

// --- Transactions ----------------------------------------------------------

function getTransactions() {
  return readJSON(TRANSACTIONS_FILE);
}

function saveTransactions(transactions) {
  writeJSON(TRANSACTIONS_FILE, transactions);
}

module.exports = {
  getUsers,
  saveUsers,
  findUserByEmail,
  findUserById,
  getTransactions,
  saveTransactions,
};
