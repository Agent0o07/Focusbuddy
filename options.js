document.addEventListener('DOMContentLoaded', () => {

    // Load saved data
    chrome.storage.local.get(["config", "accounts"], (result) => {
        const config = result.config || {};
        const accounts = result.accounts || [];

        // Fill form fields
        document.getElementById('appUrlPattern').value = config.appUrlPattern || "https://app.studystream.live/focus/room*";
        document.getElementById('zeroTimeText').value = config.zeroTimeText || "0h 0m";
        document.getElementById('loginUrlPattern').value = config.loginUrlPattern || "https://app.studystream.live/login";
        document.getElementById('usernameSelector').value = config.usernameSelector || "input#email";
        document.getElementById('passwordSelector').value = config.passwordSelector || "input#password";
        document.getElementById('submitSelector').value = config.submitSelector || "button[type='submit']";
        document.getElementById('defaultRoom').value = config.defaultRoom || "https://app.studystream.live/focus/room";
        document.getElementById('cookieDomain').value = config.cookieDomain || "studystream.live";

        // Stealth & Fingerprint settings
        document.getElementById('stealthMode').checked = config.stealthMode !== false;
        document.getElementById('fingerprintEnabled').checked = config.fingerprintEnabled !== false;
        document.getElementById('minDelay').value = config.minDelay || 800;
        document.getElementById('maxDelay').value = config.maxDelay || 2200;

        renderAccounts(accounts);
    });

    // Add Account
    document.getElementById('addAccount').addEventListener('click', () => {
        addNewAccountRow();
    });

    // Save buttons
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            if (section === "accounts") {
                saveAccounts();
            } else {
                saveSection(section);
            }
        });
    });
});

// ==================== ACCOUNTS ====================
function renderAccounts(accounts) {
    const container = document.getElementById('accounts');
    container.innerHTML = "";

    accounts.forEach((account, index) => {
        const row = document.createElement('div');
        row.className = "account-row";
        row.innerHTML = `
            <input type="email" placeholder="Email / Username" value="${account.username || ''}">
            <input type="password" placeholder="Password" value="${account.password || ''}">
            <button type="button" class="remove-account" style="background:#ef4444;color:white;padding:8px 12px;">Remove</button>
        `;

        row.querySelector('.remove-account').addEventListener('click', () => {
            accounts.splice(index, 1);
            renderAccounts(accounts);
        });

        container.appendChild(row);
    });
}

function addNewAccountRow() {
    const container = document.getElementById('accounts');
    const row = document.createElement('div');
    row.className = "account-row";
    row.innerHTML = `
        <input type="email" placeholder="Email / Username">
        <input type="password" placeholder="Password">
        <button type="button" class="remove-account" style="background:#ef4444;color:white;padding:8px 12px;">Remove</button>
    `;

    row.querySelector('.remove-account').addEventListener('click', () => row.remove());

    container.appendChild(row);
}

function saveAccounts() {
    const rows = document.querySelectorAll('.account-row');
    const accounts = [];

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const username = inputs[0].value.trim();
        const password = inputs[1].value.trim();

        if (username && password) {
            accounts.push({ username, password });
        }
    });

    chrome.storage.local.set({ accounts: accounts }, () => {
        showSavedFeedback("Accounts saved successfully!");
        renderAccounts(accounts);
    });
}

function saveSection(section) {
    let data = {};
    if (section === 'app') {
        data = {
            appUrlPattern: document.getElementById('appUrlPattern').value.trim(),
            zeroTimeText: document.getElementById('zeroTimeText').value.trim()
        };
    } else if (section === 'login') {
        data = {
            loginUrlPattern: document.getElementById('loginUrlPattern').value.trim(),
            usernameSelector: document.getElementById('usernameSelector').value.trim(),
            passwordSelector: document.getElementById('passwordSelector').value.trim(),
            submitSelector: document.getElementById('submitSelector').value.trim()
        };
    } else if (section === 'stealth') {
        data = {
            stealthMode: document.getElementById('stealthMode').checked,
            fingerprintEnabled: document.getElementById('fingerprintEnabled').checked,
            minDelay: parseInt(document.getElementById('minDelay').value) || 800,
            maxDelay: parseInt(document.getElementById('maxDelay').value) || 2200
        };
    } else if (section === 'postlogin') {
        data = { defaultRoom: document.getElementById('defaultRoom').value };
    } else if (section === 'logout') {
        data = {
            cookieDomain: document.getElementById('cookieDomain').value.trim()
        };
    }

    chrome.storage.local.set(data, () => showSavedFeedback(`${section} settings saved!`));
}

function showSavedFeedback(text) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:14px 24px;border-radius:8px;z-index:10000;`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}