// content.js - Stealth + Fingerprint
(async function () {
  const { config: savedConfig } = await chrome.storage.local.get("config");
  const config = { 
    stealthMode: true, 
    minDelay: 800, 
    maxDelay: 2200, 
    ...savedConfig 
  };
  if (!config) return;

  const url = window.location.href;

  // Timer in focus rooms
  if (config.appUrlPattern && url.includes("focus")) {
    watchForTimeUp();
  }

  // Auto-login
  const { pendingLogin } = await chrome.storage.local.get("pendingLogin");
  if (pendingLogin && url.includes("/login")) {
    await safeFillLogin(config, pendingLogin);
  }

  autoClosePaywall();

})();

// ==================== SAFE STEALTH LOGIN ====================
async function safeFillLogin(config, creds) {
  try {
    console.log("🔑 Starting stealth login for", creds.username);
    chrome.runtime.sendMessage({ type: "LOGIN_START", username: creds.username });

    await new Promise(r => setTimeout(r, 1800));

    const userField = await waitForSelector(config.usernameSelector);
    const passField = await waitForSelector(config.passwordSelector);

    if (!userField || !passField) {
      console.warn("Could not find login fields");
      return;
    }

    // Stealth: Human-like typing
    if (config.stealthMode) {
      await simulateTyping(userField, creds.username);
      await randomDelay(config.minDelay || 800, config.maxDelay || 2200);
    } else {
      userField.value = creds.username;
      userField.dispatchEvent(new Event('input', { bubbles: true }));
      userField.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 700));
    }

    if (config.stealthMode) {
      await simulateTyping(passField, creds.password);
      await randomDelay(config.minDelay || 800, config.maxDelay || 2200);
    } else {
      passField.value = creds.password;
      passField.dispatchEvent(new Event('input', { bubbles: true }));
      passField.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 1000));
    }

    // Submit
    let submitBtn = document.querySelector(config.submitSelector) || 
                    document.querySelector('button[type="submit"]');

    if (submitBtn) {
      console.log("Clicking submit button");
      submitBtn.scrollIntoView({ behavior: "smooth" });
      await randomDelay(300, 800);
      submitBtn.click();
    } else {
      console.warn("Submit button not found - trying form submit");
      const form = userField.closest('form') || passField.closest('form');
      if (form) form.submit();
    }

    await chrome.storage.local.remove("pendingLogin");
    chrome.runtime.sendMessage({ type: "LOGIN_FILLED", username: creds.username });

    // Redirect after login
    setTimeout(() => {
      const defaultRoom = config.defaultRoom || "https://app.studystream.live/focus/room";
      window.location.href = defaultRoom;
    }, config.stealthMode ? 2800 : 1500);

  } catch (e) {
    console.error("Login error:", e);
    chrome.runtime.sendMessage({ type: "LOGIN_ERROR", error: e.message });
  }
}

// ==================== STEALTH HELPERS ====================
function randomDelay(min = 800, max = 2200) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

async function simulateTyping(element, text) {
  if (!element) return;
  element.focus();
  element.value = '';
  
  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 30 + Math.random() * 80));
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// ==================== HELPERS ====================
function waitForSelector(selector, timeout = 25000) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) return resolve(document.querySelector(selector));

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

function autoClosePaywall() {
  const tryClose = () => {
    document.querySelectorAll('button').forEach(btn => {
      const cls = (btn.getAttribute('class') || '').toLowerCase();
      if (cls.includes('dismiss') || cls.includes('fluent_dismiss') || cls.includes('close')) {
        btn.click();
      }
    });
  };
  setInterval(tryClose, 800);
}

function watchForTimeUp() {
  let done = false;
  const check = () => {
    if (done) return;
    if (document.body.textContent.includes("0h 0m")) {
      done = true;
      chrome.runtime.sendMessage({ type: "TIME_UP" });
    }
  };
  setInterval(check, 2000);
}