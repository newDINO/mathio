let x = 0, y = 0;

let container = document.createElement('div');
document.body.appendChild(container);
container.style.display = 'none';
container.style.position = 'fixed';
container.style.border = '1px solid grey'
container.style.fontSize = 'small'
container.style.background = 'white'
let showing = false;

export function show_innerHTML(s: string) {
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
	if(!within_rect(x, y, rect)) {
		container.style.display = 'none';
		showing = false
	}
})
function within_rect(x: number, y: number, rect: DOMRect): boolean {
	return x > rect.x && y > rect.y &&
		x < rect.x + rect.width && y < rect.y + rect.width
}
