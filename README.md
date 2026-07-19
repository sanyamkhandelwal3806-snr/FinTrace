
# FINTRACE

A simple personal finance tracker: log income and expenses, set a monthly
savings goal, and see where your money is going.

## How it's built (on purpose, kept simple)

- **Backend:** Node.js + Express (`server.js`). One file, top to bottom,
  heavily commented. Unchanged from the first version — this redesign
  only touched the frontend.
- **"Database":** Two plain JSON files in `/data` (`users.json`,
  `transactions.json`), read and written by `db.js`. No database engine
  to install or configure — you can open these files in a text editor
  and see your own data.
- **Frontend:** Plain HTML, CSS, and JavaScript. No React, no build step,
  no bundler. Every page is a normal `.html` file you can open and read.
- **Bootstrap Icons:** loaded from a CDN, used for every icon in the app
  (sidebar nav, category icons, buttons).
- **Charts:** [Chart.js](https://www.chartjs.org/), loaded from a CDN,
  used on both the dashboard and analytics pages.
- **Fonts:** Plus Jakarta Sans (headings/body) + JetBrains Mono (all
  money figures), loaded from Google Fonts.

### What's new in this version
- Dark theme by default (gold/champagne accent), with the same light/dark
  toggle as before — just restyled. Toggle mechanism is untouched.
- Sidebar + topbar layout with a live search box (press Enter to jump to
  filtered transactions).
- Animated stat numbers (count up on load), animated sparklines per stat,
  a highlighted "current month" bar in the charts, hover/press
  micro-interactions on cards and buttons, and toast notifications when
  you add/edit/delete a transaction or hit an error.
- An eye icon on the dashboard to hide/show your balance at a glance.
- `public/js/shared.js` - a small new file holding things used on more
  than one page: category → icon lookup, money/date formatting, the
  count-up animation, and the transaction row template.

## Running it

1. Install [Node.js](https://nodejs.org/) if you don't have it (v18+).
2. Open a terminal in this folder and run:
   ```
   npm install
   npm start
   ```
3. Open **http://localhost:3000** in your browser.
4. Create an account and start adding transactions.

If port 3000 is already in use, run `PORT=4000 npm start` (or on
Windows PowerShell: `$env:PORT=4000; npm start`) and open that port instead.

## Where things live

```
server.js              -> the whole backend: routes for auth, transactions, goals, summary, CSV export
db.js                   -> tiny helper that reads/writes the JSON "database"
data/users.json         -> your account (name, email, hashed password, goal)
data/transactions.json  -> every income/expense entry, for every user

public/
  login.html, register.html      -> auth pages
  dashboard.html + js/dashboard.js   -> hero balance card, sparkline stats, chart, savings goal, quick add, recent transactions
  transactions.html + js/transactions.js -> full history: search, filter, sort, edit, delete
  analytics.html + js/analytics.js   -> category pie chart + 6-month income/expense bar chart
  css/style.css           -> every style in the app, one file, with comments
  js/api.js               -> tiny fetch() wrapper + toast notification helper
  js/theme.js             -> light/dark mode toggle (saved in localStorage)
  js/shared.js            -> category icons, money/date formatting, count-up animation, transaction row template
```

## How the pieces talk to each other

Every page's JavaScript calls `fetch()` against routes like
`/api/transactions` or `/api/summary`, which are defined in `server.js`.
The browser never touches the JSON files directly — it always goes
through the server, which checks you're logged in first.

## Ideas if you want to extend it

- Add recurring transactions (e.g. auto-add rent every month)
- Add more chart types (line chart of balance over time)
- Swap the JSON files for a real database (SQLite is a gentle next step)
- Add budgets per category, not just one overall savings goal

