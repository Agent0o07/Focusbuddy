// popup.js
async function initPopup() {
  const data = await chrome.storage.local.get(["config", "accounts", "log"]);
  
  const config = data.config || {};
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const logs = Array.isArray(data.log) ? data.log : [];

  const currentEl = document.getElementById("current");
  const accountSelect = document.getElementById("accountSelect");
  const logDiv = document.getElementById("log");
  const logContainer = document.getElementById("logContainer");

  // Show current active account
  if (accounts.length === 0) {
    currentEl.textContent = "No accounts configured";
  } else {
    const idx = config.currentIndex || 0;
    const username = accounts[idx] ? accounts[idx].username : "Unknown";
    currentEl.innerHTML = `Active: <strong>${username} (#${idx + 1})</strong>`;
  }

  // Populate Account Dropdown
  accountSelect.innerHTML = "";
  accounts.forEach((acc, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = acc?.username || `Account ${i+1}`;
    if (i === (config.currentIndex || 0)) opt.selected = true;
    accountSelect.appendChild(opt);
  });

  // Button Listeners
  document.getElementById("manualLogin").addEventListener("click", () => {
    const index = parseInt(accountSelect.value);
    if (!isNaN(index)) {
      chrome.runtime.sendMessage({ type: "MANUAL_LOGIN", accountIndex: index });
      window.close();
    }
  });

  document.getElementById("rotateNow").addEventListener("click", () => {
    const idx = config.currentIndex || 0;
    const next = (idx + 1) % Math.max(accounts.length, 1);
    chrome.runtime.sendMessage({ type: "MANUAL_LOGIN", accountIndex: next });
    window.close();
  });

  // Open Settings
  document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById("manageAccounts").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // View Logs
  let logsVisible = false;
  document.getElementById("viewLogs").addEventListener("click", () => {
    logsVisible = !logsVisible;
    logContainer.style.display = logsVisible ? "block" : "none";
    document.getElementById("viewLogs").textContent = logsVisible ? "Hide Logs" : "View Logs";
    
    if (logsVisible) {
      logDiv.innerHTML = logs.length 
        ? logs.map(log => `<div>${log}</div>`).join("") 
        : "<div>No logs yet.</div>";
    }
  });
}

initPopup();