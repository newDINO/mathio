import { MathIO } from "../target/mathio.js";
// import ( start, input, finish ) from "../target/ui.js";
let mathml_container = document.createElement('div');
mathml_container.setAttribute('tabindex', '0');
mathml_container.classList.add('math_container');
document.body.appendChild(mathml_container);
let mathio = new MathIO();
mathml_container.appendChild(mathio.root_node);
mathml_container.addEventListener('pointerdown', (e) => {
    mathio.on_pointerdown(e);
});
mathml_container.addEventListener('keydown', (e) => {
    if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
        e.preventDefault();
    }
    mathio.on_key(e.key);
});
