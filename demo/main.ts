import { MathIO } from "../target/mathio.js";

let mathio = new MathIO()
document.body.appendChild(mathio.container);
mathio.container.setAttribute('tabindex', '0');
mathio.container.classList.add('math_container');
mathio.container.addEventListener('pointerdown', (e) => {
    mathio.on_pointerdown(e);
})
mathio.container.addEventListener('keydown', (e) => {
    if(e.key == 'ArrowUp' || e.key == 'ArrowDown' || e.key == ' ' || e.key == 'Tab') {
        e.preventDefault()
    }
    mathio.on_key(e.key);
})
