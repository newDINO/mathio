export function is_ascii_upper_char(code) {
    return code >= 65 && code <= 90;
}
export function is_ascii_lower_char(code) {
    return code >= 97 && code <= 122;
}
export function char_to_bold(s) {
    let code = s.codePointAt(0);
    if (!code)
        return s;
    if (is_ascii_upper_char(code)) {
        code += 0x1D400 - 65;
    }
    else if (is_ascii_lower_char(code)) {
        code += 0x1D41A - 97;
    }
    return String.fromCodePoint(code);
}
// function char_to_italic(code: number): string {
// 	if(is_ascii_upper_char(code)) {
// 		code += 0x1D434 - 65
// 	} else if(is_ascii_lower_char(code)) {
// 		code += 0x1D44E - 97
// 		if(code == 0x1D455) code = 0x210E
// 	}
//     return String.fromCodePoint(code)
// }
// function char_to_bold_italic(code: number): string {
// 	if(is_ascii_upper_char(code)) {
// 		code += 0x1D468 - 65
// 	} else if(is_ascii_lower_char(code)) {
// 		code += 0x1D482 - 97
// 	}
//     return String.fromCodePoint(code)
// }
