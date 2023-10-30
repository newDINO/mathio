// The first page and second page use 2 different methods to switch between shift mod and normal mod.
// Sadly, the two do not have a significant preformance difference.
// So one of them need to be removed or a new approach need to be developed with a better performance.
export class SoftKeyboard {
	container: HTMLElement;
	constructor(on_key_handle: (key: string) => void) {
		this.container = html_e('div');
		this.container.style.userSelect = 'none';
		let inner = html_e('div');
		this.container.appendChild(inner);
		inner.style.position = 'relative';
		inner.style.width = inner.style.height = '100%';
		let first_page = new FirstPage(on_key_handle);
		let second_page = new SecondPage(on_key_handle);
		second_page.element.style.display = 'none'
		first_page.other = second_page.element;
		second_page.other = first_page.element;
		inner.append(first_page.element, second_page.element);
	}
}
const dblclick_time = 500;
enum ShiftState {
	Short, Long, Not
}
const line1_shift_keys = ['!','@','#','$','%','^','&','*','(',')']
const line2_keys = ['q','w','e','r','t','y','u','i','o','p']
const line3_keys = ['a','s','d','f','g','h','j','k','l']
const line4_keys = ['z','x','c','v','b','n','m']
const line5_keys = ['-','=','/','\\'];
const line5_shift_keys = ['_','+','?','|'];
class FirstPage {
	element: HTMLElement;
	other: HTMLElement | undefined;
	shift_state = ShiftState.Not;
	shift_key: ShiftKey;
	on_key_handle: (key: string) => void;
	keys: Key[] = [];
	constructor(on_key_handle: (key: string) => void) {
		this.on_key_handle = on_key_handle
		this.element = html_e('div');
		this.element.style.position = 'absolute'
		this.element.style.width = this.element.style.height = "100%"
		let line1 = create_line();
		let on_key = (key: string) => {
			this.on_key(key)
		}
		for(let i = 1; i <= 10; i++) {
			let key = new CommonKey((i%10).toString(), line1_shift_keys[i - 1], on_key);
			this.keys.push(key);
			key.element.style.width = '10%'
			line1.appendChild(key.element)
		}

		let line2 = create_line();
		for(let i = 0; i < 10; i++) {
			let key = new CharKey(line2_keys[i], on_key);
			this.keys.push(key);
			key.element.style.width = '10%'
			line2.appendChild(key.element);
		}

		let line3 = create_line();
		for(let i = 0; i < 9; i++) {
			let key = new CharKey(line3_keys[i], on_key);
			this.keys.push(key);
			key.element.style.width = '10%'
			line3.appendChild(key.element);
		}
		let back_key = backspace_key(on_key)
		line3.appendChild(back_key);

		let line4 = create_line();
		let tab_key_e = tab_key(on_key);
		line4.appendChild(tab_key_e)
		for(let i = 0; i < 7; i++) {
			let key = new CharKey(line4_keys[i], on_key);
			this.keys.push(key);
			key.element.style.width = '10%'
			line4.appendChild(key.element);
		}
		let small_key = new CommonKey('[', '{', on_key)
		this.keys.push(small_key);
		small_key.element.style.width = '10%'
		line4.appendChild(small_key.element);
		let big_key = new CommonKey(']', '}', on_key)
		this.keys.push(big_key);
		big_key.element.style.width = '10%'
		line4.appendChild(big_key.element);

		let line5 = create_line();
		this.shift_key = new ShiftKey();
		let last_time = 0;
		this.shift_key.element.addEventListener('pointerdown', () => {
			let time = performance.now();
			let dt = time - last_time;
			last_time = time;
			if(dt >= dblclick_time) {
				if(this.shift_state == ShiftState.Not) {
					this.shift_state = ShiftState.Short;
					this.shift();
					this.shift_key.set_background('');
				} else if(this.shift_state == ShiftState.Short) {
					this.shift_state = ShiftState.Not;
					this.unshift_straight();
					this.shift_key.set_background(button_color)
				} else {
					this.shift_state = ShiftState.Not;
					this.unshift_straight();
					this.shift_key.set_background(button_color)
					this.shift_key.set_fill('black')
				}
			} else {
				if(this.shift_state == ShiftState.Not) {
					this.shift_state = ShiftState.Short;
					this.shift();
					this.shift_key.set_background('');
				} else if(this.shift_state == ShiftState.Short) {
					this.shift_state = ShiftState.Long;
					this.shift_key.set_fill('none')
				} else {
					this.shift_state = ShiftState.Not;
					this.unshift_straight();
					this.shift_key.set_background(button_color)
					this.shift_key.set_fill('black')
				}
			}
		})
		line5.appendChild(this.shift_key.element)
		let page_key = more_keys(on_key);
		page_key.addEventListener('pointerdown', () => {
			this.element.style.display = 'none';
			if(this.other) {
				this.other.style.display = 'block'
			}
		});
		line5.appendChild(page_key);
		for(let i = 0; i < 4; i++) {
			let key = new CommonKey(line5_keys[i], line5_shift_keys[i], on_key);
			this.keys.push(key)
			key.element.style.width = '10%';
			line5.appendChild(key.element)
		}
		let left_key_e = left_key(on_key);
		line5.appendChild(left_key_e);
		let updown_key_e = updown_key(on_key);
		line5.appendChild(updown_key_e)
		let right_key_e = right_key(on_key);
		line5.appendChild(right_key_e);
		let enter_key_e = enter_key(on_key);
		line5.appendChild(enter_key_e);
		this.element.append(line1, line2, line3, line4, line5)
	}
	private on_key(key: string) {
		if(this.on_key_handle) this.on_key_handle(key);
		if(this.shift_state == ShiftState.Long || this.shift_state == ShiftState.Short) {
			this.unshift()
		}
	}
	unshift() {
		if(this.shift_state == ShiftState.Short) {
			this.shift_state = ShiftState.Not;
			this.shift_key.set_background(button_color)
			for(let key of this.keys) key.unshift()
		}
	}
	shift() {
		for(let key of this.keys) key.shift()
	}
	unshift_straight() {
		for(let key of this.keys) key.unshift()
	}
}
const line1_keys_p2 = ['¬','∧','∃','⊑','⊒','∩','ⅆ','∂','√','·'];
const line1_s_keys_p2 = ['∈','∨','∀','⊏','⊐','∪','ⅈ','∇','∞','×'];
const line2_keys_p2 = ['ς','ε','ρ','τ','υ','θ','ι','ο','π'];
const line3_keys_p2 = ['α','σ','δ','φ','γ','η','ξ','κ','λ'];
const line4_keys_p2 = ['ζ','χ','ψ','ω','β','ν','μ'];
class SecondPage {
	element: HTMLElement;
	other: HTMLElement | undefined;
	page: HTMLElement;
	shift_page: HTMLElement;
	shift() {
		this.page.style.visibility = 'hidden'
		this.shift_page.style.visibility = 'visible'
	}
	unshift() {
		this.page.style.visibility = 'visible'
		this.shift_page.style.visibility = 'hidden'
	}
	constructor(on_key_handle: (key: string) => void) {
		let shift_state = ShiftState.Not;
		let last_time = 0;
		let on_key = (key: string) => {
			if(shift_state == ShiftState.Short) {
				shift_state = ShiftState.Not;
				this.unshift();
			}
			on_key_handle(key)
		}

		this.element = same_size_inner();
		this.page = same_size_inner();
		this.shift_page = same_size_inner();
		this.shift_page.style.visibility = 'hidden'
		this.element.append(this.page, this.shift_page)

		let line1 = create_line();
		for(let i = 0; i < 10; i++) {
			line1.appendChild(common_key(line1_keys_p2[i], line1_s_keys_p2[i], on_key))
		}
		let line2 = create_line();
		line2.appendChild(common_key(';', ':', on_key));
		for(let i = 0; i < 9; i++) {
			line2.appendChild(char_key(line2_keys_p2[i], on_key));
		}
		let line3 = create_line();
		for(let c of line3_keys_p2) {
			line3.appendChild(char_key(c, on_key))
		}
		line3.appendChild(backspace_key(on_key));
		let line4 = create_line();
		line4.appendChild(tab_key(on_key));
		for(let c of line4_keys_p2) {
			line4.appendChild(char_key(c, on_key));
		}
		line4.appendChild(common_key(',', '<', on_key));
		line4.appendChild(common_key('.', '>', on_key));
		let line5 = create_line();
		let shift_key_e = shift_key();
		line5.appendChild(shift_key_e);
		let page_key = more_keys(on_key);
		page_key.addEventListener('pointerdown', () => {
			this.element.style.display = 'none';
			if(this.other) {
				this.other.style.display = 'block'
			}
		});
		line5.appendChild(page_key)
		line5.appendChild(common_key('`', '~', on_key));
		line5.appendChild(common_key('\'', '"', on_key));
		line5.append(space_key(on_key), left_key(on_key), updown_key(on_key), right_key(on_key), enter_key(on_key));
		this.page.append(line1, line2, line3, line4, line5)

		let line1s = create_line();
		for(let i = 0; i < 10; i++) {
			line1s.appendChild(common_key_s(line1_keys_p2[i], line1_s_keys_p2[i], on_key))
		}
		let line2s = create_line();
		line2s.appendChild(common_key_s(';', ':', on_key));
		for(let i = 0; i < 9; i++) {
			line2s.appendChild(char_key(line2_keys_p2[i].toUpperCase(), on_key));
		}
		let line3s = create_line();
		for(let c of line3_keys_p2) {
			line3s.appendChild(char_key(c.toUpperCase(), on_key))
		}
		line3s.appendChild(backspace_key(on_key));
		let line4s = create_line();
		line4s.appendChild(tab_key(on_key));
		for(let c of line4_keys_p2) {
			line4s.appendChild(char_key(c.toUpperCase(), on_key));
		}
		line4s.appendChild(common_key_s(',', '<', on_key));
		line4s.appendChild(common_key_s('.', '>', on_key));
		let line5s = create_line();
		let shift_key_s = new ShiftKeyS();
		shift_key_s.element.addEventListener('pointerdown', () => {
			let time = performance.now();
			if(shift_state == ShiftState.Short) {
				if(time - last_time > dblclick_time) {
					this.unshift()
					shift_state = ShiftState.Not;
				} else {
					shift_key_s.set_long();
					shift_state = ShiftState.Long;
				}
			} else {
				this.unshift();
				shift_state = ShiftState.Not;
			}
		})
		shift_key_e.addEventListener('pointerdown', () => {
			this.shift()
			last_time = performance.now();
			shift_state = ShiftState.Short;
			shift_key_s.set_short();
		})
		line5s.appendChild(shift_key_s.element);
		let page_key_s = more_keys(on_key);
		page_key_s.addEventListener('pointerdown', () => {
			this.element.style.display = 'none';
			if(this.other) {
				this.other.style.display = 'block'
			}
		});
		line5s.appendChild(page_key_s)
		line5s.appendChild(common_key_s('`', '~', on_key));
		line5s.appendChild(common_key_s('\'', '"', on_key));
		line5s.append(space_key(on_key), left_key(on_key), updown_key(on_key), right_key(on_key), enter_key(on_key));
		this.shift_page.append(line1s, line2s, line3s, line4s, line5s)
	}
}
let button_color = 'rgb(127 127 127 / .5)'
function html_e(type: string): HTMLElement {
	return document.createElement(type)
}
function svg_e(type: string): SVGElement {
	return document.createElementNS('http://www.w3.org/2000/svg', type);
}
function create_line(): HTMLElement {
	let line = html_e('div')
	line.style.display = 'flex'
	line.style.justifyContent = 'center'
	line.style.height = '20%'
	return line
}
interface Key {
	element: HTMLElement;
	shift(): void;
	unshift(): void;
}
function svg_char(c: string): SVGElement {
	let svg = svg_e('svg');
	let text = svg_e('text');
	text.innerHTML = c;
	svg.appendChild(text);
	text.setAttribute('font-size', '10px');
	text.setAttribute('font-family', 'math, serif')
	text.setAttribute('y', '10');
	svg.setAttribute('viewBox', '0 0 10 10');
	return svg;
}
function create_inner(): HTMLElement {
	let inner = html_e('div');
	inner.style.margin = '5%'
	inner.style.width = inner.style.height = '90%'
	inner.style.backgroundColor = button_color;
	inner.style.position = 'relative'
	return inner
}
function inner_svg(): SVGElement {
	let result = svg_e('svg')
	result.style.width = '90%'
	result.style.height = '90%'
	result.style.margin = '5%'
	result.style.backgroundColor = button_color
	result.setAttribute('viewBox', '0 0 100 100');
	return result;
}
function svg_line(x1: number, y1: number, x2: number, y2: number): SVGElement {
	let line = svg_e('line')
	line.setAttribute('stroke', 'black');
	line.setAttribute('x1', x1.toString())
	line.setAttribute('y1', y1.toString())
	line.setAttribute('x2', x2.toString())
	line.setAttribute('y2', y2.toString())
	return line;
}
function svg_polyline(points: string): SVGElement {
	let result = svg_e('polyline')
	result.setAttribute('stroke', 'black');
	result.setAttribute('fill', 'none')
	result.setAttribute('points', points);
	return result;
}
function svg_polygon(points: string): SVGElement {
	let result = svg_e('polygon')
	result.setAttribute('fill', 'black')
	result.setAttribute('stroke', 'black')
	result.setAttribute('points', points);
	return result;
}
const BIG_SCALE = '61.8%'
const SMALL_SCALE = '38.2%'
function set_scale(e: SVGElement | HTMLElement, scale: string) {
	e.style.width = e.style.height = scale;
}
class CharKey implements Key{
	element: HTMLElement;
	inner: HTMLElement;
	key_e: SVGElement;
	s_key_e: SVGElement;
	key: string;
	constructor(key: string, on_key: (key: string) => void) {
		this.key = key;
		this.element = html_e('div');
		this.inner = create_inner();
		this.key_e = svg_char(key);
		this.inner.appendChild(this.key_e)
		this.s_key_e = svg_char(key.toUpperCase());
		this.key_e.style.position = this.s_key_e.style.position = 'absolute'
		this.key_e.style.bottom = this.s_key_e.style.bottom = '0px'
		set_scale(this.key_e, '70%');
		set_scale(this.s_key_e, '70%');
		this.element.appendChild(this.inner);
		this.element.addEventListener('pointerdown', () => {
			on_key(this.key);
			this.inner.style.backgroundColor = '';
		})
		this.element.addEventListener('pointerup', () => {
			this.inner.style.backgroundColor = button_color
		})
		this.element.addEventListener('pointerout', () => {
			this.inner.style.backgroundColor = button_color
		})
	}
	shift() {
		this.key = this.key.toUpperCase();
		this.inner.replaceChildren(this.s_key_e)
	}
	unshift() {
		this.key = this.key.toLowerCase()
		this.inner.replaceChildren(this.key_e)
	}
}
class CommonKey implements Key {
	element: HTMLElement;
	key_e: SVGElement;
	s_key_e: SVGElement;
	key: string;
	s_key: string;
	current_key: string;
	constructor(key: string, s_key: string, on_key: (key: string) => void) {
		this.key = key;
		this.s_key = s_key;
		this.current_key = key;
		this.element = html_e('div');

		let inner = create_inner();
		this.element.addEventListener('pointerdown', () => {
			on_key(this.current_key)
			inner.style.backgroundColor = ''
		})
		this.element.addEventListener('pointerup', () => {
			inner.style.backgroundColor = button_color
		})
		this.element.addEventListener('pointerout', () => {
			inner.style.backgroundColor = button_color
		})

		this.key_e = svg_char(key);
		this.s_key_e = svg_char(s_key);
		this.element.appendChild(inner)
		inner.append(this.key_e, this.s_key_e)

		this.key_e.style.position = this.s_key_e.style.position  = 'absolute';
		this.key_e.style.left = this.key_e.style.bottom = '0px'
		this.s_key_e.style.right = this.s_key_e.style.top = '0px'
		set_scale(this.key_e, BIG_SCALE)
		set_scale(this.s_key_e, SMALL_SCALE)
	}
	shift() {
		this.current_key = this.s_key;
		set_scale(this.key_e, SMALL_SCALE)
		set_scale(this.s_key_e, BIG_SCALE)
	}
	unshift() {
		this.current_key = this.key;
		set_scale(this.key_e, BIG_SCALE)
		set_scale(this.s_key_e, SMALL_SCALE)
	}
}
function backspace_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg(); 
	result.appendChild(svg)
	result.addEventListener('pointerdown', () => {
		on_key('Backspace')
		svg.style.backgroundColor = ''
	})
	result.addEventListener('pointerup', () => {
		svg.style.backgroundColor = button_color
	})
	result.addEventListener('pointerout', () => {
		svg.style.backgroundColor = button_color
	})
	let polyline = svg_polygon('40,30 80,30 80,70 40,70 20,50 40,30');
	svg.appendChild(polyline);
	return result;
}
function tab_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg();
	result.addEventListener('pointerdown', () => {
		svg.style.backgroundColor = ''
		on_key('Tab')
	})
	result.addEventListener('pointerup', () => {
		svg.style.backgroundColor = button_color
	})
	result.addEventListener('pointerout', () => {
		svg.style.backgroundColor = button_color
	})
	result.appendChild(svg)
	let l1 = svg_line(20, 30, 20, 50);
	let pl1 = svg_polygon('40,30 20,40 40,50');
	let l2 = svg_line(20, 40, 80, 40);
	let l3 = svg_line(80, 70, 80, 50);
	let pl2 = svg_polygon('60,70 80,60 60,50');
	let l4 = svg_line(80, 60, 20, 60)
	svg.append(l1, pl1, l2, l3, pl2, l4)
	return result
}
class ShiftKey {
	element: HTMLElement;
	svg: SVGElement;
	arrow: SVGElement;
	constructor() {
		this.element = html_e('div');
		this.element.style.width = '10%'
		this.svg = inner_svg() 
		this.element.appendChild(this.svg)
		this.arrow = svg_polygon('50,20 80,50 60,50 60,80 40,80 40,50 20,50 50,20');
		this.svg.appendChild(this.arrow)
	}
	set_background(color: string) {
		this.svg.style.backgroundColor = color;
	}
	set_fill(color: string) {
		this.arrow.setAttribute('fill', color)
	}
}
function more_keys(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg() 
	result.appendChild(svg)
	let polyline = svg_polyline('20,40 20,80 60,80 60,40');
	let polygon = svg_polygon('40,20 80,20 80,60 60,60 60,40 40,40');
	svg.append(polygon, polyline);
	return result
}
function left_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg();
	result.addEventListener('pointerdown', () => {
		svg.style.backgroundColor = ''
		on_key('ArrowLeft')
	})
	result.addEventListener('pointerup', () => {
		svg.style.backgroundColor = button_color
	})
	result.addEventListener('pointerout', () => {
		svg.style.backgroundColor = button_color
	})
	result.appendChild(svg);
	let polyline = svg_polygon('60,20 40,50 60,80')
	svg.appendChild(polyline)
	return result
}
function right_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg();
	result.addEventListener('pointerdown', () => {
		svg.style.backgroundColor = ''
		on_key('ArrowRight')
	})
	result.addEventListener('pointerup', () => {
		svg.style.backgroundColor = button_color
	})
	result.addEventListener('pointerout', () => {
		svg.style.backgroundColor = button_color
	})
	result.appendChild(svg);
	let polyline = svg_polygon('40,20 60,50 40,80')
	svg.appendChild(polyline)
	return result
}
function updown_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let inner = html_e('div');
	inner.style.width = '90%'
	inner.style.height = '90%'
	inner.style.margin = '5%'
	inner.style.position = 'relative'
	result.appendChild(inner)
	let up_svg = svg_e('svg');
	let down_svg = svg_e('svg');
	inner.append(up_svg, down_svg);
	up_svg.style.backgroundColor = down_svg.style.backgroundColor = button_color;
	up_svg.style.width = down_svg.style.width = '100%';
	up_svg.style.height = down_svg.style.height = '50%';
	up_svg.style.position = down_svg.style.position = 'absolute'
	up_svg.style.top = down_svg.style.bottom = '0px'
	up_svg.setAttribute('viewBox', '0 0 100 100');
	down_svg.setAttribute('viewBox', '0 0 100 100');
	result.addEventListener('pointerdown', (e) => {
		if(e.offsetY < result.offsetWidth * 0.5) {
			on_key('ArrowUp');
			up_svg.style.backgroundColor = ''
		} else {
			on_key('ArrowDown');
			down_svg.style.backgroundColor = ''
		}
	})
	result.addEventListener('pointerup', () => {
		up_svg.style.backgroundColor = down_svg.style.backgroundColor = button_color;
	})
	result.addEventListener('pointerout', () => {
		up_svg.style.backgroundColor = down_svg.style.backgroundColor = button_color;
	})
	let up_polygon = svg_polygon('50,40 75,60 25,60')
	up_svg.appendChild(up_polygon)
	let down_polygon = svg_polygon('50,60 75,40 25,40')
	down_svg.appendChild(down_polygon)
	return result
}
function enter_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg();
	result.appendChild(svg);
	result.addEventListener('pointerdown', () => {
		on_key('Enter')
		svg.style.backgroundColor = ''
	})
	result.addEventListener('pointerup', () => {
		svg.style.backgroundColor = button_color
	})
	result.addEventListener('pointerout', () => {
		svg.style.backgroundColor = button_color
	})
	let polygon = svg_polygon('40,40 40,80 20,60');
	let polyline = svg_polyline('75,25 75,60 40,60')
	svg.append(polygon, polyline);
	return result
}
function same_size_inner(): HTMLElement {
	let result = html_e('div');
	set_scale(result, '100%');
	result.style.position = 'absolute';
	return result
}
function char_key(c: string, on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let inner = create_inner();
	result.appendChild(inner);
	let svg = svg_char(c);
	inner.appendChild(svg);
	set_scale(svg, '70%');
	svg.style.position = 'absolute';
	svg.style.left = '0px';
	svg.style.bottom = '0px';
	result.addEventListener('pointerdown', () => {
		on_key(c);
		inner.style.backgroundColor = ''
	});
	result.addEventListener('pointerout', () => {
		inner.style.backgroundColor = button_color;
	})
	result.addEventListener('pointerout', () => {
		inner.style.backgroundColor = button_color;
	})
	return result;
}
function common_key(key: string, s_key: string, on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let inner = create_inner();
	result.addEventListener('pointerdown', () => {
		on_key(key);
		inner.style.backgroundColor = ''
	})
	result.addEventListener('pointerup', () => {
		inner.style.backgroundColor = button_color;
	})
	result.addEventListener('pointerout', () => {
		inner.style.backgroundColor = button_color;
	})
	result.appendChild(inner);
	let key_e = svg_char(key);
	let s_key_e = svg_char(s_key);
	set_scale(key_e, BIG_SCALE);
	set_scale(s_key_e, SMALL_SCALE);
	key_e.style.position = s_key_e.style.position = 'absolute';
	key_e.style.left = s_key_e.style.right = key_e.style.bottom = s_key_e.style.top = '0px';
	inner.append(key_e, s_key_e);
	return result
}
function common_key_s(key: string, s_key: string, on_key: (key: string) => void) {
	let result = html_e('div');
	result.style.width = '10%'
	let inner = create_inner();
	result.addEventListener('pointerdown', () => {
		on_key(s_key);
		inner.style.backgroundColor = ''
	})
	result.addEventListener('pointerup', () => {
		inner.style.backgroundColor = button_color;
	})
	result.addEventListener('pointerout', () => {
		inner.style.backgroundColor = button_color;
	})
	result.appendChild(inner);
	let key_e = svg_char(key);
	let s_key_e = svg_char(s_key);
	set_scale(key_e, SMALL_SCALE);
	set_scale(s_key_e, BIG_SCALE);
	key_e.style.position = s_key_e.style.position = 'absolute';
	key_e.style.left = s_key_e.style.right = key_e.style.bottom = s_key_e.style.top = '0px';
	inner.append(key_e, s_key_e);
	return result
}
function space_key(on_key: (key: string) => void): HTMLElement {
	let result = html_e('div');
	result.style.width = '20%'
	let inner = html_e('div');
	inner.style.margin = '2.5%'
	inner.style.width = '95%';
	inner.style.height = '90%';
	inner.style.backgroundColor = button_color;
	result.addEventListener('pointerdown', () => {
		on_key(' ');
		inner.style.backgroundColor = ''
	})
	result.addEventListener('pointerup', () => {
		inner.style.backgroundColor = button_color;
	})
	result.addEventListener('pointerout', () => {
		inner.style.backgroundColor = button_color;
	})
	result.appendChild(inner);
	return result
}
function shift_key(): HTMLElement {
	let result = html_e('div');
	result.style.width = '10%'
	let svg = inner_svg() 
	result.appendChild(svg)
	let arrow = svg_polygon('50,20 80,50 60,50 60,80 40,80 40,50 20,50 50,20');
	svg.appendChild(arrow)
	return result
}
class ShiftKeyS {
	element: HTMLElement;
	arrow: SVGElement;
	constructor() {
		this.element = html_e('div');
		this.element.style.width = '10%'
		let svg = inner_svg();
		svg.style.backgroundColor = '';
		this.element.appendChild(svg)
		this.arrow = svg_polygon('50,20 80,50 60,50 60,80 40,80 40,50 20,50 50,20');
		svg.appendChild(this.arrow)
	}
	set_long() {
		this.arrow.setAttribute('fill', 'none');
	}
	set_short() {
		this.arrow.setAttribute('fill', 'black');
	}
}
