// background.js
const DEFAULT_CONFIG = {
  appUrlPattern: "https://app.studystream.live/focus/room*",
  indicatorSelector: "",
  zeroTimeText: "0h 0m",
  loginUrlPattern: "https://app.studystream.live/login",
  usernameSelector: "input#email",
  passwordSelector: "input#password",
  submitSelector: "button[type='submit']",
  logoutMethod: "clear-cookies",
  cookieDomain: "studystream.live",
  defaultRoom: "https://app.studystream.live/focus/room",
  currentIndex: 0,
  stealthMode: true,
  minDelay: 800,
  maxDelay: 2200,
  fingerprintEnabled: true
};

async function getConfig() {
  const { config } = await chrome.storage.local.get("config");
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

async function getAccounts() {
  const { accounts } = await chrome.storage.local.get("accounts");
  return accounts || [];
}

async function logEvent(msg) {
  const { log = [] } = await chrome.storage.local.get("log");
  const entry = `[${new Date().toLocaleString()}] ${msg}`;
  const entries = [entry, ...log].slice(0, 100);
  await chrome.storage.local.set({ log: entries });
  return entry;
}

async function forceLogout(tabId, config) {
  await logEvent("Starting force logout...");

  await clearCookiesForDomain(config.cookieDomain);

  if (tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach(c => {
              const name = c.split("=")[0].trim();
              document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
            });
          } catch (e) {}
        }
      });
    } catch (e) {
      await logEvent(`Script execution failed: ${e.message}`);
    }
  }

  await logEvent("Force logout completed");
}

async function clearCookiesForDomain(domain) {
  if (!domain) return;
  try {
    const cookies = await chrome.cookies.getAll({ domain: domain });
    for (const cookie of cookies) {
      const url = `https://${cookie.domain.replace(/^\./, "")}${cookie.path || "/"}`;
      await chrome.cookies.remove({ url, name: cookie.name });
    }
  } catch (e) {}
}

async function handleManualLogin(accountIndex) {
  const config = await getConfig();
  const accounts = await getAccounts();

  if (accounts.length === 0) {
    await logEvent("No accounts configured");
    return;
  }

  const index = Number(accountIndex) % accounts.length;
  const account= accounts[index];
  if (!account) return;

  await logEvent(`Switching to Account #${index + 1} (${account.username})`);

  await chrome.storage.local.set({ 
    config: { ...config, currentIndex: index } 
  });

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs[0]?.id;

  await forceLogout(tabId, config);
  await chrome.storage.local.set({ pendingLogin: account });

  if (tabId) {
    await chrome.tabs.update(tabId, { url: config.loginUrlPattern });
    await logEvent("Redirecting to login page");
  }
}

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MANUAL_LOGIN") {
    handleManualLogin(message.accountIndex);
  } 
  else if (message.type === "LOGIN_FILLED") {
    logEvent(`Login successful: ${message.username}`);
  } 
  else if (message.type === "LOGIN_START") {
    logEvent(`Starting login for ${message.username}`);
  }
  else if (message.type === "LOGIN_ERROR") {
    logEvent(`Login failed: ${message.error}`);
  } 
  else if (message.type === "TIME_UP") {
    logEvent("Timer reached zero → Rotating account");
    
    getConfig().then(config => {
      getAccounts().then(accounts => {
        if (accounts.length > 0) {
          const nextIndex = (config.currentIndex + 1) % accounts.length;
          handleManualLogin(nextIndex);
        }
      });
    });
  }
});