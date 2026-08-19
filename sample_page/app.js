let count = 0;
const countDisplay = document.getElementById('tap-count');
const btn = document.getElementById('counter-btn');

btn.addEventListener('click', () => {
    count++;
    countDisplay.textContent = count;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 100);
});
