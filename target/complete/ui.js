export let list_e = document.createElement('table');
const selected_color = 'rgb(127 127 127 / .5)';
list_e.style.visibility = 'hidden';
list_e.style.position = 'fixed';
list_e.style.border = '1px rgb(127 127 127 / .5) solid';
list_e.style.borderCollapse = 'collapse';
let lines = [];
let selected_index = -1;
export function selected_value() {
    if (selected_index >= 0) {
        return lines[selected_index].value;
    }
    else {
        return null;
    }
}
export function refresh(list) {
    let new_lines = [];
    list_e.replaceChildren();
    for (let e of list) {
        let line = new Line(e);
        new_lines.push(line);
        list_e.appendChild(line.element);
    }
    lines = new_lines;
    if (list.length > 0) {
        selected_index = 0;
        lines[0].element.style.backgroundColor = selected_color;
    }
    else {
        selected_index = -1;
    }
}
export function next() {
    if (selected_index < 0)
        return;
    let line = lines[selected_index];
    line.element.style.backgroundColor = '';
    if (selected_index + 1 == lines.length) {
        selected_index = 0;
        lines[0].element.style.backgroundColor = selected_color;
    }
    else {
        selected_index += 1;
        lines[selected_index].element.style.backgroundColor = selected_color;
    }
}
export function previous() {
    if (selected_index < 0)
        return;
    let line = lines[selected_index];
    line.element.style.backgroundColor = '';
    if (selected_index == 0) {
        selected_index = lines.length - 1;
        lines[selected_index].element.style.backgroundColor = selected_color;
    }
    else {
        selected_index -= 1;
        lines[selected_index].element.style.backgroundColor = selected_color;
    }
}
export function select(index) {
    return lines[index].value;
}
const hover_color = 'rgb(127 127 127 / .25)';
class Line {
    constructor(e) {
        this.value = e.value;
        this.element = document.createElement('tr');
        let name_e = document.createElement('td');
        name_e.innerHTML = e.name;
        let value_e = document.createElement('td');
        value_e.textContent = e.value;
        this.element.append(name_e, value_e);
        this.element.addEventListener('pointerenter', () => {
            if (lines[selected_index] != this) {
                this.element.style.backgroundColor = hover_color;
            }
        });
        this.element.addEventListener('pointerleave', () => {
            if (lines[selected_index] != this) {
                this.element.style.backgroundColor = '';
            }
        });
    }
}
