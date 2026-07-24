// fingerprint.js - Anti-Detection
(async function () {
  const config = await chrome.storage.local.get("config");
  if (!config.config?.fingerprintEnabled) return;

  console.log("%c🛡️ Advanced Fingerprint Protection Active", "color: #10b981; font-weight: bold");

  const seed = Date.now() + Math.random();

  // Random User Agent Rotation
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0"
  ];
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

  // Spoof Navigator
  Object.defineProperty(navigator, 'userAgent', { get: () => randomUA });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 + Math.floor(Math.random() * 8) });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 + Math.floor(Math.random() * 8) });
  Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
  Object.defineProperty(screen, 'width', { get: () => 1920 + Math.floor(Math.random() * 200) });
  Object.defineProperty(screen, 'height', { get: () => 1080 + Math.floor(Math.random() * 100) });

  // Canvas Fingerprint Noise
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
    const data = originalGetImageData.call(this, x, y, w, h);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] += Math.floor(Math.random() * 3) - 1;     // R
      data.data[i+1] += Math.floor(Math.random() * 3) - 1;   // G
      data.data[i+2] += Math.floor(Math.random() * 3) - 1;   // B
    }
    return data;
  };

  // WebGL Spoofing
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    if (parameter === 37445) return "Intel Inc.";
    if (parameter === 37446) return "Intel Iris Xe Graphics";
    return originalGetParameter.call(this, parameter);
  };

  console.log("%c🛡️ Advanced anti-detection enabled", "color: #10b981");
})();
