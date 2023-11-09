import { MathIO } from "../target/mathio.js";
import { SoftKeyboard } from "../target/soft_keyboard.js"
import * as float_div from "./float_div.js"

document.body.classList.add('inner_center')
let container = document.createElement('div');
container.classList.add('container');
document.body.appendChild(container);

let mathio = new MathIO()
container.appendChild(mathio.container);
mathio.container.setAttribute('tabindex', '0');
mathio.container.classList.add('math_container', 'inner_center')
mathio.container.addEventListener('pointerdown', (e) => {
    mathio.on_pointerdown(e);
})
mathio.container.addEventListener('keydown', (e) => {
    if(e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == ' ' || e.key == 'Tab') {
        e.preventDefault()
    }
    mathio.on_key(e.key);
})

let under_bar = document.createElement('div')
under_bar.classList.add("bar")
container.appendChild(under_bar);

let bold_button = document.createElement('div');
bold_button.innerHTML = 'B'
bold_button.classList.add('button', 'inner_center');
under_bar.appendChild(bold_button);
bold_button.addEventListener('click', () => {
    if(mathio.bold) {
        bold_button.innerHTML = 'B'
        mathio.bold = false
    } else {
        bold_button.innerHTML = '𝐁'
        mathio.bold = true
    }
})

let copy_button = document.createElement('div');
under_bar.appendChild(copy_button);
copy_button.classList.add('button');
copy_button.style.marginLeft = 'auto';
copy_button.style.backgroundImage = 'url("demo/res/copy.svg")';
copy_button.addEventListener('click', () => {
	navigator.clipboard.writeText(mathio.to_ml_text()).then(
		() => {
			float_div.show_innerHTML("Copied");
		},
		() => {
			float_div.show_innerHTML("Copy failed");
		}
	);
})

let keyboard_button = document.createElement('div');
under_bar.appendChild(keyboard_button)
keyboard_button.classList.add('button')
keyboard_button.style.backgroundImage = 'url("demo/res/keyboard.svg")'
let soft_keyboard = new SoftKeyboard((key) => {
    mathio.on_key(key)
});
soft_keyboard.container.classList.add('keyboard');
document.body.appendChild(soft_keyboard.container);
soft_keyboard.container.style.display = 'none'
keyboard_button.addEventListener('pointerdown', () => {
    if(soft_keyboard.container.style.display != '') {
        soft_keyboard.container.style.display = ''
    } else {
        soft_keyboard.container.style.display = 'none'
    }
})

document.body.appendChild(float_div.container)

let last_touch_end = 0;
window.addEventListener('touchend', (e) => {
    let now = performance.now();
    if(now - last_touch_end < 300) {
        e.preventDefault();
    }
    last_touch_end = now;
})