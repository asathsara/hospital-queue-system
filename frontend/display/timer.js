function updateClock() {
    const timer = document.getElementById('timer');
    if (!timer) return;
    const now = new Date();
    timer.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();