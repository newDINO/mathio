import { MathIO } from "../target/mathio.js";
import { SoftKeyboard } from "../target/soft_keyboard.js"

let container = document.createElement('div');
container.classList.add('container');
document.body.appendChild(container);

let mathio = new MathIO()
container.appendChild(mathio.container);
mathio.container.setAttribute('tabindex', '0');
mathio.container.classList.add('math_container')
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
let keyboard_button = document.createElement('div');
keyboard_button.style.marginLeft = 'auto'
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
