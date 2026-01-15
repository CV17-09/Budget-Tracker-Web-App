 // Dashboard logic: add/delete transactions + totals

const userId = sessionStorage.getItem("currentUserId");

// If somehow opened without session, auth.js should redirect,
// but we guard anyway.
if (!userId) {
  window.location.href = "index.html";
}

const txForm = document.getElementById("txForm");
const txList = document.getElementById("txList");
const txEmpty = document.getElementById("txEmpty");
const dashMessage = document.getElementById("dashMessage");

const incomeTotalEl = document.getElementById("incomeTotal");
const expenseTotalEl = document.getElementById("expenseTotal");
const balanceTotalEl = document.getElementById("balanceTotal");

const txType = document.getElementById("txType");
const txAmount = document.getElementById("txAmount");
const txCategory = document.getElementById("txCategory");
const txDate = document.getElementById("txDate");
const txNote = document.getElementById("txNote");

// Set default date to today
if (txDate) {
  const today = new Date().toISOString().slice(0, 10);
  txDate.value = today;
}

function showDashMessage(text, isError = false) {
  if (!dashMessage) return;
  dashMessage.textContent = text;
  dashMessage.style.color = isError ? "crimson" : "#1f3f35";
}

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function computeTotals(txs) {
  let income = 0;
  let expense = 0;

  for (const t of txs) {
    const amt = Number(t.amount) || 0;
    if (t.type === "income") income += amt;
    else expense += amt;
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}

function renderTotals(txs) {
  const totals = computeTotals(txs);
  incomeTotalEl.textContent = formatMoney(totals.income);
  expenseTotalEl.textContent = formatMoney(totals.expense);
  balanceTotalEl.textContent = formatMoney(totals.balance);
}

function renderList(txs) {
  txList.innerHTML = "";

  if (!txs.length) {
    txEmpty.style.display = "block";
    return;
  }

  txEmpty.style.display = "none";

  for (const t of txs) {
    const item = document.createElement("div");
    item.className = `tx-item ${t.type}`;

    item.innerHTML = `
      <div class="tx-main">
        <div class="tx-top">
          <span class="tx-type">${t.type.toUpperCase()}</span>
          <span class="tx-amount">${formatMoney(t.amount)}</span>
        </div>
        <div class="tx-meta">
          <span class="tx-category">${t.category}</span>
          <span class="tx-date">${t.date}</span>
        </div>
        ${t.note ? `<div class="tx-note">${t.note}</div>` : ""}
      </div>
      <button class="tx-delete" type="button" data-id="${t.id}">Delete</button>
    `;

    txList.appendChild(item);
  }

  // delete handlers
  document.querySelectorAll(".tx-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const updated = deleteTransaction(userId, id);
      renderTotals(updated);
      renderList(updated);
    });
  });
}

function refresh() {
  const txs = loadTransactions(userId);
  renderTotals(txs);
  renderList(txs);
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

txForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = txType.value;
  const amount = Number(txAmount.value);
  const category = txCategory.value.trim();
  const date = txDate.value;
  const note = txNote.value.trim();

  if (!amount || amount <= 0) {
    showDashMessage("Amount must be greater than 0.", true);
    return;
  }
  if (!category) {
    showDashMessage("Category is required.", true);
    return;
  }
  if (!date) {
    showDashMessage("Date is required.", true);
    return;
  }

  const tx = {
    id: makeId(),
    type,
    amount: Math.round(amount * 100) / 100,
    category,
    date,
    note,
    createdAt: new Date().toISOString(),
  };

  const updated = addTransaction(userId, tx);
  showDashMessage("Transaction added ✅");
  txForm.reset();

  // set date again after reset
  txDate.value = new Date().toISOString().slice(0, 10);

  renderTotals(updated);
  renderList(updated);
});

// initial load
refresh();
