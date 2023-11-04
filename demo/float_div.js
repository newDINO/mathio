let x = 0, y = 0;
export let container = document.createElement('div');
container.style.display = 'none';
container.style.position = 'fixed';
container.style.border = '1px solid lightgrey';
container.style.padding = '2px';
container.style.fontSize = 'small';
container.style.color = 'grey';
container.style.background = "inherit";
let showing = false;
export function show_innerHTML(s) {
    container.innerHTML = s;
    container.style.display = '';
    container.style.top = y + 'px';
    container.style.left = x + 'px';
    showing = true;
}
window.addEventListener('pointerdown', (e) => {
    x = e.clientX;
    y = e.clientY;
    let rect = container.getBoundingClientRect();
    if (!within_rect(x, y, rect) && showing) {
        container.style.display = 'none';
        showing = false;
    }
});
function within_rect(x, y, rect) {
    return x > rect.x && y > rect.y &&
        x < rect.x + rect.width && y < rect.y + rect.width;
}
