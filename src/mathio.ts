import { complete, MatchResult } from "./complete/complete.js"
import { element as completing_list, refresh as refresh_complete } from "./complete/ui.js"
const INTERNAL_LOGIC_ERROR = new Error('Internal logic error')
const ORPHAN_ERROR = new Error('Element does not has a parent')
export class MathIO {
    private cursor: MathMLElement;
    private completing = false;
    private completing_text = '';
    private completing_e1: MathMLElement;
    private completing_e2: MathMLElement;
    private _root_node: MathMLElement;
    public get root_node(): MathMLElement {
        return this._root_node
    }
    private _warn_handle: ((warning: string) => void) | undefined;
    public set warn_handle(handle: (warning: string) => void) {
        this._warn_handle = handle
    }
    // settings
    private _vertical_fraction = true;
    public set vertical_fraction(setting: boolean) {
        this._vertical_fraction = setting
    }
    constructor() {
        this._root_node = ml_text('math', '');
        this._root_node.setAttribute('display', 'block')
        this.root_node.style.userSelect = 'none';
        this.root_node.style.cursor = 'text'

        // this.cursor = ml_nodes('msubsup', [ml_text('mo', '&#x222B;'), ml_text('mn', '1'), ml_text('mn', '0')]);
        this.cursor = create_cursor()
        this.root_node.appendChild(this.cursor);

        this.completing_e1 = ml_text('mtext', '\\');
        this.completing_e2 = ml_e('mtext');
    }
    private warn(warning: string) {
        if(this._warn_handle) this._warn_handle(warning)
    }
    on_pointerdown(event: PointerEvent) {
        let e = event.target;
        console.log(e)
        if(!(e instanceof Element)) return;
        let last_prev_e = this.cursor.previousElementSibling;
        let last_next_e = this.cursor.nextElementSibling;
        let last_parent = this.cursor.parentElement;
        if(!last_parent) throw ORPHAN_ERROR
        let last_grand_parent = last_parent.parentElement;
        let parent = e.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!last_grand_parent || !grand_parent) {
            throw ORPHAN_ERROR
        }

        if(e.tagName != 'mrow' && (parent.tagName == 'mfrac' || parent.tagName == 'msub' || (parent.tagName == 'msup' && e == parent.lastElementChild))) {
            encircle_element(e, 'mrow');
        }
        if(e.tagName == 'mo' || e.tagName == 'mi') {
            if(parent.tagName == 'msub' && e.parentElement && e.parentElement == parent.firstElementChild) {
                e.insertAdjacentElement('afterend', this.cursor);
                start_modify(e.parentElement)
                this.cursor.style.visibility = 'hidden';
            } else if(parent.tagName == 'msup') {
                if(2 * event.offsetX < e.getBoundingClientRect().width) {
                    parent.insertAdjacentElement('beforebegin', this.cursor);
                } else {
                    encircle_element(e, 'mrow')
                    e.insertAdjacentElement('afterend', this.cursor)
                }
            } else if(grand_parent.tagName == 'msup' && parent == grand_parent.firstElementChild) {
                if(e.innerHTML == ')' && e == parent.lastElementChild) {
                    e.insertAdjacentElement('beforebegin', this.cursor)
                } else if(e == parent.firstElementChild) {
                    if(2 * event.offsetX < e.getBoundingClientRect().width) {
                        grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                    } else {
                        e.insertAdjacentElement('afterend', this.cursor)
                    }
                } else {
                    if(2 * event.offsetX < e.getBoundingClientRect().width) {
                        e.insertAdjacentElement('beforebegin', this.cursor)
                    } else {
                        e.insertAdjacentElement('afterend', this.cursor)
                    }
                }
            } else if(!(grand_parent.tagName == 'msub' && parent == grand_parent.firstElementChild)) {
                if(2 * event.offsetX < e.getBoundingClientRect().width) {
                    e.insertAdjacentElement('beforebegin', this.cursor)
                } else {
                    e.insertAdjacentElement('afterend', this.cursor)
                }
            }
        } else if(e.tagName == 'mn') {
            let unit_width = e.getBoundingClientRect().width / e.innerHTML.length;
            let index = Math.round(event.offsetX / unit_width);
            if(index == 0) {
                e.insertAdjacentElement('beforebegin', this.cursor);
            } else if(index == e.innerHTML.length) {
                e.insertAdjacentElement('afterend', this.cursor);
            } else {
                split_element(e, index);
                e.insertAdjacentElement('afterend', this.cursor);
            }
        } else if(e.tagName == 'math' || e.tagName == 'mrow') {
            for(let i = 0; i < e.children.length; i++) {
                let child = e.children[i];
                if(child.getBoundingClientRect().x > event.clientX) {
                    child.insertAdjacentElement('beforebegin', this.cursor);
                    break;
                }
            }
        } else if(e.tagName == 'mspace' && e != this.cursor) {
            e.parentElement?.appendChild(this.cursor);
            e.remove();
        }
        if(last_next_e && last_prev_e && last_next_e.previousElementSibling && last_next_e.tagName == 'mn' && last_prev_e.tagName == 'mn' && last_next_e.previousElementSibling != this.cursor) {
            merge_elements(last_next_e.previousElementSibling, last_next_e)
        }
        if(last_grand_parent.tagName == 'msub' && last_grand_parent.firstElementChild == last_parent && last_parent != parent) {
            this.cursor.style.visibility = 'visible';
        } else if(last_grand_parent.tagName == 'mfrac' && last_parent.children.length == 0) {
            last_parent.appendChild(ml_space())
        }
        if(is_group_exp(last_grand_parent) && last_parent.children.length == 1 && last_parent.firstElementChild && last_parent.firstElementChild != this.cursor) {
            replace_parent(last_parent.firstElementChild);
        }
        this.resize_cursor()
    }
    on_key(key: string) {
        if(this.completing) {
            this.on_complete_key(key);
            return
        }
        if(key == 'ArrowRight') {
            this.on_arrow_right();
        } else if(key == 'ArrowLeft') {
            this.on_arrow_left();
        } else if(key == 'Backspace') {
            this.on_backspace();
        } else if(key == 'ArrowUp') {
            this.on_arrow_up()
        } else if(key == 'ArrowDown') {
            this.on_arrow_down()
        } else if(key.length > 1) {
            return;
        } else if(key == '_') {
            this.on_subscript()
        } else if(key == '^') {
            this.on_superscript()
        } else if(is_num(key)) {
            this.on_num(key)
        } else if(key == '+' || key == '-' || key == '=' || key == '(' || key == ')') {
            this.cursor.insertAdjacentElement('beforebegin', ml_text('mo', key));
        } else if(is_char(key)) {
            this.on_char(key)
        } else if(key == '/') {
            this.on_fraction();
        } else if(key == '√') {
        } else if(key == '\\') {
            this.completing = true;
            this.start_completing();
        }
        this.resize_cursor()
    }
    private start_completing() {
        refresh_complete(complete(this.completing_text));
        this.cursor.insertAdjacentElement('beforebegin', this.completing_e1);
        this.cursor.insertAdjacentElement('afterend', this.completing_e2);
        let box = this.cursor.getBoundingClientRect();
        completing_list.style.left = box.x + 'px';
        completing_list.style.top = box.y + box.height + 'px';
        completing_list.style.visibility = 'visible';
    }
    private stop_completing() {
        completing_list.style.visibility = 'hidden';
        this.completing_e1.remove();
        this.completing_e2.remove();
        this.completing_e1.innerHTML = '\\';
        this.completing_e2.innerHTML = this.completing_text = '';
        this.completing = false;
    }
    private on_complete_key(key: string) {
        if(key == "Tab" || key == 'Space') {
            
        } else if(key == 'ArrowLeft') {

        } else if(key == 'ArrowRight') {
            
        } else if(key == 'ArrowUp') {

        } else if(key == 'ArrowDown') {

        } else if(key == 'Backspace') {
            let s = this.completing_e1.innerHTML;
            if(s.length > 0) {
                this.completing_e1.innerHTML = s.slice(0, s.length - 1);
            } else if(this.completing_e2.innerHTML.length == 0) {
                this.stop_completing();
            }
        } else if(key.length == 1) {
            this.completing_text += key;
            this.completing_e1.innerHTML += key;
            refresh_complete(complete(this.completing_text));
            let box = this.cursor.getBoundingClientRect();
            completing_list.style.left = box.x + 'px';
            completing_list.style.top = box.y + box.height + 'px';
        }
    }
    private resize_cursor() {
        let compute_e = ml_text('mi', 'f');
        this.cursor.insertAdjacentElement('afterend', compute_e);
        this.cursor.setAttribute('height', compute_e.getBoundingClientRect().height + 3 + 'px');
        compute_e.remove();
    }
    private on_arrow_up() {
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR;
        if(grand_parent.tagName == 'mfrac' && parent == grand_parent.lastElementChild) {
            if(parent.children.length == 1) {
                parent.appendChild(ml_space());
            }
            if(!grand_parent.firstElementChild) throw INTERNAL_LOGIC_ERROR;
            let first_child = grand_parent.firstElementChild;
            if(first_child.tagName != 'mrow') {
                encircle_element(first_child, 'mrow');
                if(first_child.tagName == 'mspace') {
                    first_child.remove();
                    grand_parent.firstElementChild.appendChild(this.cursor)
                } else {
                    let rect = first_child.getBoundingClientRect();
                    let middle = rect.x + rect.width * 0.5;
                    if(this.cursor.getBoundingClientRect().x > middle) {
                        first_child.insertAdjacentElement('afterend', this.cursor)
                    } else {
                        first_child.insertAdjacentElement('beforebegin', this.cursor)
                    }
                }
            } else {
                insert_in_pos(this.cursor.getBoundingClientRect().x, first_child, this.cursor);
            }
            if(parent.children.length == 1) {
                if(!parent.firstElementChild) throw INTERNAL_LOGIC_ERROR;
                replace_parent(parent.firstElementChild)
            }
        } else if(grand_parent.tagName == 'msup') {

        } else if(grand_parent.tagName == 'msub') {
            
        }
    }
    private on_arrow_down() {
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR;
        if(grand_parent.tagName == 'mfrac' && parent == grand_parent.firstElementChild) {
            if(parent.children.length == 1) {
                parent.appendChild(ml_space());
            }
            if(!grand_parent.lastElementChild) throw INTERNAL_LOGIC_ERROR;
            let first_child = grand_parent.lastElementChild;
            if(first_child.tagName != 'mrow') {
                encircle_element(first_child, 'mrow');
                if(first_child.tagName == 'mspace') {
                    first_child.remove();
                    grand_parent.lastElementChild.appendChild(this.cursor)
                } else {
                    let rect = first_child.getBoundingClientRect();
                    let middle = rect.x + rect.width * 0.5;
                    if(this.cursor.getBoundingClientRect().x > middle) {
                        first_child.insertAdjacentElement('afterend', this.cursor)
                    } else {
                        first_child.insertAdjacentElement('beforebegin', this.cursor)
                    }
                }
            } else {
                insert_in_pos(this.cursor.getBoundingClientRect().x, first_child, this.cursor);
            }
            if(parent.children.length == 1) {
                if(!parent.firstElementChild) throw INTERNAL_LOGIC_ERROR;
                replace_parent(parent.firstElementChild)
            }
        }
    }
    private on_arrow_right() {
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR;
        let prev_e = this.cursor.previousElementSibling;
        let next_e = this.cursor.nextElementSibling;
        if(prev_e && prev_e.tagName == 'mn' && next_e && next_e.tagName == 'mn') {
            if(next_e.innerHTML.length > 1) {
                split_element(next_e, 1);
                merge_elements(prev_e, next_e);
                prev_e.insertAdjacentElement('afterend', this.cursor);
            } else {
                merge_elements(prev_e, next_e);
            }
        } else if(next_e) {
            if(next_e.tagName == 'mn' && next_e.innerHTML.length > 1) {
                split_element(next_e, 1);
                next_e.insertAdjacentElement('afterend', this.cursor);
            } else if(next_e.tagName == 'msub') {
                if(!next_e.firstElementChild) throw INTERNAL_LOGIC_ERROR
                encircle_element(next_e.firstElementChild, 'mrow');
                next_e.firstElementChild.appendChild(this.cursor);
                start_modify(next_e.firstElementChild as MathMLElement)
                this.cursor.style.visibility = 'hidden';
            } else if(next_e.tagName == 'msup') {
                let first_child = next_e.firstElementChild;
                if(!first_child) throw INTERNAL_LOGIC_ERROR
                if(first_child.tagName == 'mrow') {
                    if(!first_child.firstElementChild) throw INTERNAL_LOGIC_ERROR
                    first_child.firstElementChild.insertAdjacentElement('afterend', this.cursor);
                } else {
                    encircle_element(first_child, 'mrow');
                    if(!next_e.firstElementChild) throw INTERNAL_LOGIC_ERROR
                    next_e.firstElementChild.appendChild(this.cursor);
                }
            } else if(next_e.tagName == 'mfrac') {
                if(!next_e.firstElementChild) throw INTERNAL_LOGIC_ERROR
                let first_child = next_e.firstElementChild;
                if(first_child.tagName != 'mrow') {
                    encircle_element(first_child, 'mrow');
                }
                if(first_child.tagName == 'mspace') {
                    first_child.remove()
                }
                next_e.firstElementChild.insertAdjacentElement('afterbegin', this.cursor);
            } else if(grand_parent.tagName == 'msup' && parent == grand_parent.firstElementChild && next_e.innerHTML == ')' && next_e == parent.lastElementChild) {
                if(!grand_parent.lastElementChild || !parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
                if(grand_parent.lastElementChild.tagName != 'mrow') {
                    encircle_element(grand_parent.lastElementChild, 'mrow');
                }
                grand_parent.lastElementChild.insertAdjacentElement('afterbegin', this.cursor);
                if(parent.children.length == 1) {
                    replace_parent(parent.firstElementChild)
                }
            } else {
                next_e.insertAdjacentElement('afterend', this.cursor);
            }
        } else if(grand_parent.tagName == 'msup') {
            if(!grand_parent.lastElementChild || !parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
            if(parent == grand_parent.lastElementChild) {
                grand_parent.insertAdjacentElement('afterend', this.cursor);
                if(parent.children.length == 1) {
                    replace_parent(parent.firstElementChild);
                }
            } else if(parent == grand_parent.firstElementChild) {
                if(grand_parent.lastElementChild.tagName != 'mrow') {
                    encircle_element(grand_parent.lastElementChild, 'mrow');
                }
                grand_parent.lastElementChild.insertAdjacentElement('afterbegin', this.cursor);
                if(parent.children.length == 1) {
                    replace_parent(parent.firstElementChild)
                }
            }
        } else if(grand_parent.tagName == 'msub') {
            if(!grand_parent.lastElementChild || !parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
            if(parent == grand_parent.lastElementChild) {
                grand_parent.insertAdjacentElement('afterend', this.cursor);
                if(parent.children.length == 1) {
                    replace_parent(parent.firstElementChild);
                }
            } else if(parent == grand_parent.firstElementChild) {
                if(grand_parent.lastElementChild.tagName != 'mrow') {
                    encircle_element(grand_parent.lastElementChild, 'mrow');
                }
                grand_parent.lastElementChild.insertAdjacentElement('afterbegin', this.cursor);
                replace_parent(parent.firstElementChild);
                this.cursor.style.visibility = 'visible';
            }
        } else if(grand_parent.tagName == 'mfrac') {
            if(this.cursor == parent.firstElementChild) {
                parent.appendChild(ml_space());
            }
            grand_parent.insertAdjacentElement('afterend', this.cursor);
            if(parent.children.length == 1) {
                replace_parent(parent.firstElementChild as Element);
            }
        }
    }
    private on_arrow_left() {
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR
        let prev_e = this.cursor.previousElementSibling;
        let next_e = this.cursor.nextElementSibling;
        if(prev_e) {
            if(prev_e.tagName == 'msup' || prev_e.tagName == 'msub') {
                if(!prev_e.lastElementChild) throw INTERNAL_LOGIC_ERROR
                if(prev_e.lastElementChild.tagName != 'mrow') {
                    encircle_element(prev_e.lastElementChild, 'mrow');
                }
                prev_e.lastElementChild.appendChild(this.cursor);
            } else if(prev_e.tagName == 'mfrac') {
                if(!prev_e.lastElementChild) throw INTERNAL_LOGIC_ERROR;
                let last_child = prev_e.lastElementChild
                if(last_child.tagName != 'mrow') {
                    encircle_element(last_child, 'mrow');
                }
                if(last_child.tagName == 'mspace') {
                    last_child.remove()
                }
                prev_e.lastElementChild.appendChild(this.cursor);
            } else if(prev_e.tagName == 'mn') {
                if(prev_e.innerHTML.length > 1) {
                    if(next_e && next_e.tagName == 'mn') {
                        split_element(prev_e, prev_e.innerHTML.length - 1);
                        if(!prev_e.nextElementSibling) throw INTERNAL_LOGIC_ERROR
                        merge_elements(prev_e.nextElementSibling, next_e);
                        prev_e.insertAdjacentElement('afterend', this.cursor);
                    } else {
                        split_element(prev_e, prev_e.innerHTML.length - 1);
                        prev_e.insertAdjacentElement('afterend', this.cursor);
                    }
                } else {
                    if(next_e && next_e.tagName == 'mn') {
                        merge_elements(prev_e, next_e);
                        prev_e.insertAdjacentElement('beforebegin', this.cursor);
                    } else {
                        prev_e.insertAdjacentElement('beforebegin', this.cursor);
                    }
                }
            } else if(parent.firstElementChild == prev_e) {
                if(grand_parent.tagName == 'msub' && grand_parent.firstElementChild == parent) {
                    grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                    this.cursor.style.visibility = 'visible';
                    replace_parent(parent.firstElementChild);
                } else if(grand_parent.tagName == 'msup' && grand_parent.firstElementChild == parent) {
                    grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                    if(parent.children.length == 1) {
                        replace_parent(parent.firstElementChild);
                    }
                } else {
                    prev_e.insertAdjacentElement('beforebegin', this.cursor);
                }
            } else {
                prev_e.insertAdjacentElement('beforebegin', this.cursor);
            }
        } else {
            if(grand_parent.tagName == 'msub') {
                if(parent == grand_parent.lastElementChild) {
                    if(!grand_parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
                    encircle_element(grand_parent.firstElementChild, 'mrow');
                    grand_parent.firstElementChild.appendChild(this.cursor);
                    start_modify(grand_parent.firstElementChild as MathMLElement)
                    this.cursor.style.visibility = 'hidden'
                    if(parent.children.length == 1) {
                        replace_parent(parent.firstElementChild as Element);
                    }
                }
            } else if(grand_parent.tagName == 'msup') {
                if(parent == grand_parent.lastElementChild) {
                    let first_child = grand_parent.firstElementChild;
                    if(!first_child) throw INTERNAL_LOGIC_ERROR
                    if(first_child.tagName == 'mrow') {
                        if(!first_child.lastElementChild) throw INTERNAL_LOGIC_ERROR
                        first_child.lastElementChild.insertAdjacentElement('beforebegin', this.cursor);
                    } else {
                        if(!grand_parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
                        encircle_element(grand_parent.firstElementChild, 'mrow');
                        grand_parent.firstElementChild.appendChild(this.cursor);
                    }
                    if(parent.children.length == 1) {
                        replace_parent(parent.firstElementChild as Element);
                    }
                }
            } else if(grand_parent.tagName == 'mfrac') {
                if(parent.children.length == 1) {
                    parent.appendChild(ml_space());
                }
                grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                if(parent.children.length == 1) {
                    replace_parent(parent.firstElementChild as Element);
                }
            }
        }
    }
    private on_backspace() {
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR
        let prev_e = this.cursor.previousElementSibling;
        if(prev_e) {
            if(prev_e.tagName == 'mn' && prev_e.innerHTML.length > 1) {
                prev_e.innerHTML = prev_e.innerHTML.substring(0, prev_e.innerHTML.length - 1)
            } else if(grand_parent.tagName == 'msup' && parent == grand_parent.firstElementChild && prev_e == parent.firstElementChild && parent.children.length > 2) {
                if(parent.children.length > 4) {
                    this.warn('Does not support removing the bracket when there are elements in the base.')
                } else {
                    prev_e.remove();
                    if(!parent.lastElementChild) throw INTERNAL_LOGIC_ERROR
                    parent.lastElementChild.remove()
                }
            } else {
                parent.removeChild(prev_e);
            }
        } else {
            if(grand_parent.tagName == 'msub') {
                if(parent == grand_parent.firstElementChild) {
                    grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                    this.cursor.style.visibility = ''
                    grand_parent.remove();
                } else if(parent == grand_parent.lastElementChild && parent.children.length == 1) {
                    let first_child = grand_parent.firstElementChild;
                    if(!first_child) throw INTERNAL_LOGIC_ERROR
                    replace_parent(first_child);
                    first_child.insertAdjacentElement('afterend', this.cursor);
                }
            } else if(grand_parent.tagName == 'msup') {
                if(parent == grand_parent.firstElementChild) {
                    grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                    grand_parent.remove();
                } else if(parent == grand_parent.lastElementChild && parent.children.length == 1) {
                    let first_child = grand_parent.firstElementChild;
                    if(!first_child) throw INTERNAL_LOGIC_ERROR
                    replace_parent(first_child);
                    first_child.insertAdjacentElement('afterend', this.cursor);
                }
            } else if(grand_parent.tagName == 'mfrac') {
                if(parent == grand_parent.firstElementChild) {

                } else if(parent == grand_parent.lastElementChild && parent.children.length == 1) {
                    let first_child = grand_parent.firstElementChild;
                    if(!first_child) throw INTERNAL_LOGIC_ERROR;
                    if(first_child.tagName != 'mspace') {
                        replace_parent(first_child);
                        first_child.insertAdjacentElement('afterend', this.cursor);
                    } else {
                        grand_parent.insertAdjacentElement('beforebegin', this.cursor);
                        grand_parent.remove()
                    }
                }
            }
        }
    }
    private on_subscript() { // other time using '_' send doesn't support info or generate an empty sub slot
        let prev_e = this.cursor.previousElementSibling;
        if(prev_e && prev_e.tagName == 'mi') {
            let msub_e = ml_text('msub', '');
            this.cursor.insertAdjacentElement('beforebegin', msub_e);
            msub_e.appendChild(prev_e);
            let sub_e = ml_text('mrow', '');
            msub_e.appendChild(sub_e);
            sub_e.appendChild(this.cursor);
        }
    }
    private on_superscript() {
        let prev_e = this.cursor.previousElementSibling;
        if(!prev_e) return;
        if(is_single_exp(prev_e)) {
            let msup_e = ml_text('msup', '');
            this.cursor.insertAdjacentElement('beforebegin', msup_e);
            msup_e.appendChild(prev_e);
            let sup_e = ml_text('mrow', '');
            msup_e.appendChild(sup_e);
            sup_e.appendChild(this.cursor);
        } else if(prev_e.innerHTML == ')') {
            let contained_e = [prev_e];
            let has_bra = false;
            let previous_e = prev_e.previousElementSibling;
            while(previous_e) {
                contained_e.push(previous_e);
                if(previous_e.innerHTML == '(') {
                    has_bra = true;
                    break;
                }
                previous_e = previous_e.previousElementSibling;
            }
            if(has_bra) {
                let base_e = ml_e('mrow');
                for(let i = contained_e.length - 1; i >= 0; i--) {
                    base_e.appendChild(contained_e[i]);
                }
                let msup_e = ml_nodes('msup', base_e, ml_e('mrow'))
                this.cursor.insertAdjacentElement('beforebegin', msup_e);
                if(!msup_e.lastElementChild) throw INTERNAL_LOGIC_ERROR
                msup_e.lastElementChild.appendChild(this.cursor);
            } else {
                this.warn('The bracket is incomplete');
            }
        }
    }
    private on_fraction() {
        let prev_e = this.cursor.previousElementSibling;
        if(this._vertical_fraction) {
            if(prev_e && is_single_exp(prev_e)) {
                let mfrac_e = ml_nodes('mfrac', prev_e, ml_e('mrow'));
                this.cursor.insertAdjacentElement('beforebegin', mfrac_e);
                if(!mfrac_e.lastElementChild) throw INTERNAL_LOGIC_ERROR
                mfrac_e.lastElementChild.appendChild(this.cursor);
            } else {
                let mfrac_e = ml_nodes('mfrac', ml_e('mrow'), ml_space());
                this.cursor.insertAdjacentElement('beforebegin', mfrac_e);
                if(!mfrac_e.firstElementChild) throw INTERNAL_LOGIC_ERROR
                mfrac_e.firstElementChild.appendChild(this.cursor)
            }
        } else {
            this.cursor.insertAdjacentElement('beforebegin', ml_text('mo', '/'));
        }
    }
    private on_num(key: string) {
        let prev_e = this.cursor.previousElementSibling;
        if(prev_e && prev_e.tagName == 'mn') {
            prev_e.innerHTML += key;
        } else {
            this.cursor.insertAdjacentElement('beforebegin', ml_text('mn', key));
        }
    }
    private on_char(key: string) {
        let prev_e = this.cursor.previousElementSibling;
        let parent = this.cursor.parentElement;
        if(!parent) throw ORPHAN_ERROR
        let grand_parent = parent.parentElement;
        if(!grand_parent) throw ORPHAN_ERROR
        if(grand_parent.tagName == 'msup' && parent == grand_parent.firstElementChild && this.cursor == parent.lastElementChild && prev_e) {
            bracket(prev_e as MathMLElement);
            prev_e.insertAdjacentElement('afterend', this.cursor);
            if(!parent.firstElementChild) throw INTERNAL_LOGIC_ERROR
            replace_parent(parent.firstElementChild)
        }
        this.cursor.insertAdjacentElement('beforebegin', ml_text('mi', key));
    }
}
function ml_e(type: string): MathMLElement {
    return document.createElementNS('http://www.w3.org/1998/Math/MathML', type)
}
function ml_text(type: string, inner: string): MathMLElement {
	let result = document.createElementNS('http://www.w3.org/1998/Math/MathML', type);
	result.innerHTML = inner;
	return result;
}
function ml_nodes(type: string, ...inner: Element[]): MathMLElement {
	let result = document.createElementNS('http://www.w3.org/1998/Math/MathML', type);
	inner.forEach((i) => {
		result.appendChild(i);
	})
	return result;
}
function ml_space(): MathMLElement {
    let space_e = ml_e('mspace');
    space_e.setAttribute('width', '10px');
    space_e.setAttribute('height', '10px')
    return space_e;
}
function bracket(e: MathMLElement) {
    let shell = ml_e('mrow');
    if(e.previousElementSibling) {
        e.previousElementSibling.insertAdjacentElement('afterend', shell);
    } else if(e.nextElementSibling) {
        e.nextElementSibling.insertAdjacentElement('beforebegin', shell);
    } else if(e.parentElement) {
        e.parentElement.appendChild(shell);
    } else {
        throw ORPHAN_ERROR
    }
    shell.append(ml_text('mo', '('), e, ml_text('mo', ')'))
}
const BLANK_STRING_ERROR = new Error('The string dose not have any character')
function is_char(s: string): boolean {
    let code = s.codePointAt(0)
    if(!code) throw BLANK_STRING_ERROR
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}
function is_num(s: string): boolean {
    let code = s.codePointAt(0)
    if(!code) throw BLANK_STRING_ERROR
    return (code >= 48 && code <= 57)
}

function split_element(e: Element, offset: number) { // the original element become the first one
    let former_text = e.innerHTML.substring(0, offset);
    let latter_text = e.innerHTML.substring(offset);
    e.innerHTML = former_text;
    let latter = ml_text(e.tagName, latter_text);
    e.insertAdjacentElement('afterend', latter);
}
function merge_elements(former: Element, latter: Element) {
    former.innerHTML = former.innerHTML + latter.innerHTML;
    latter.remove();
}
function encircle_element(e: Element, shell_tag: string) {
    let shell = document.createElementNS('http://www.w3.org/1998/Math/MathML', shell_tag);
    if(e.previousElementSibling) {
        e.previousElementSibling.insertAdjacentElement('afterend', shell);
    } else if(e.nextElementSibling) {
        e.nextElementSibling.insertAdjacentElement('beforebegin', shell);
    } else if(e.parentElement) {
        e.parentElement.appendChild(shell);
    } else {
        throw ORPHAN_ERROR
    }
    shell.appendChild(e)
}
function replace_parent(e: Element) {
    let parent = e.parentElement;
    if(!parent) throw ORPHAN_ERROR
    if(parent.previousElementSibling) {
        parent.previousElementSibling.insertAdjacentElement('afterend', e);
    } else if(parent.nextElementSibling) {
        parent.nextElementSibling.insertAdjacentElement('beforebegin', e);
    } else if(parent.parentElement) {
        parent.parentElement.appendChild(e);
    } else {
        throw ORPHAN_ERROR
    }
    parent.remove();
}
function is_single_exp(e: Element): boolean {
    return e.tagName == 'mn' || e.tagName == 'mi' || e.tagName == 'msup' || e.tagName == 'msub' || e.tagName == 'mfrac'
}
function is_group_exp(e: Element): boolean {
    return e.tagName == 'msup' || e.tagName == 'msub' || e.tagName == 'mfrac'
}
function create_cursor(): MathMLElement {
    let cursor = ml_e('mspace')
    cursor.setAttribute('width', '1px');
    cursor.setAttribute('height', '10px');
    cursor.setAttribute('depth', '3px');
    cursor.style.userSelect = 'none';
    cursor.style.backgroundColor = 'grey';
    let hidden = false;
    setInterval(() => {
        if(hidden) {
            cursor.style.backgroundColor = 'grey'
            hidden = false
        }
        else {
            cursor.style.backgroundColor = 'transparent'
            hidden = true
        }
    }, 500)
    return cursor
}
function start_modify(e: MathMLElement) {
    e.style.color = 'white'
    e.style.backgroundColor = 'grey'
}
function insert_in_pos(x: number, container: Element, to_insert: Element) {
    let es = Array.from(container.children)
    for(let e of es) {
        let rect = e.getBoundingClientRect();
        let middle = rect.x + rect.width * 0.5;
        if(x < middle) {
            e.insertAdjacentElement('beforebegin', to_insert);
            return
        }
    }
    es[es.length - 1].insertAdjacentElement('afterend', to_insert)
}