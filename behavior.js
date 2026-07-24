// behavior.js - Human-like Behavior
(async function () {
  const simulateHumanBehavior = () => {
    // Random mouse movements
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;

    const moveMouse = () => {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      x = Math.max(50, Math.min(window.innerWidth - 50, x));
      y = Math.max(50, Math.min(window.innerHeight - 50, y));

      const event = new MouseEvent('mousemove', {
        clientX: x,
        clientY: y,
        bubbles: true
      });
      document.dispatchEvent(event);
    };

    setInterval(moveMouse, 800 + Math.random() * 1200);

    // Occasional scrolling
    setInterval(() => {
      if (Math.random() > 0.7) {
        window.scrollBy(0, (Math.random() - 0.5) * 120);
      }
    }, 4500);
  };

  setTimeout(simulateHumanBehavior, 5000);
})();