// Transactions are stored per user: "transactions_<userId>"

function getCurrentUserId() {
  return sessionStorage.getItem("currentUserId");
}

function txKey(userId) {
  return `transactions_${userId}`;
}

function loadTransactions(userId) {
  const raw = localStorage.getItem(txKey(userId));
  return JSON.parse(raw || "[]");
}

function saveTransactions(userId, txs) {
  localStorage.setItem(txKey(userId), JSON.stringify(txs));
}

function addTransaction(userId, tx) {
  const txs = loadTransactions(userId);
  txs.unshift(tx); // newest first
  saveTransactions(userId, txs);
  return txs;
}

function deleteTransaction(userId, txId) {
  const txs = loadTransactions(userId).filter(t => t.id !== txId);
  saveTransactions(userId, txs);
  return txs;
}
