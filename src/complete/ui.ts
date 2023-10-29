import { MatchResult } from "./complete.js"
export let element = document.createElement('table');
document.body.appendChild(element);
element.style.visibility = 'hidden'
element.style.position = 'fixed';
element.style.border = '1px lightgrey solid';
let selected: HTMLElement | undefined;
function line(e: MatchResult): HTMLElement {
    let result = document.createElement('tr');
    let name_e = document.createElement('td');
    name_e.innerHTML = e.name;
    let value_e = document.createElement('td');
    value_e.textContent = e.value;
    result.append(name_e, value_e)
    return result;
}
export function refresh(list: MatchResult[]) {
    let to_replace = [];
    for(let i of list) {
        to_replace.push(line(i))
    }
    if(to_replace.length > 0) {
        to_replace[0].style.backgroundColor = 'lightgrey';
        selected = to_replace[0];
    }
    element.replaceChildren(...to_replace)
}