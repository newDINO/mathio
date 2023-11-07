import { entity_data } from "./entity_data.js";
export let match_num = 7;
export function complete(s) {
    let result = [];
    match(s, '', result, 0, entity_data);
    return result;
}
function match(s, pre, result, pos, branch) {
    if (pos == s.length) {
        add_on(s, result, branch);
        if (result.length == match_num)
            return;
    }
    else {
        if (s[pos] in branch) {
            let node = branch[s[pos]];
            if (node.vl) {
                let name = pre + s[pos];
                let last = result.push({ name, value: node.vl }) - 1;
                if (name == s)
                    swap(result, 0, last);
                if (result.length == match_num)
                    return;
            }
            if (node.br) {
                match(s, pre + s[pos], result, pos + 1, node.br);
                if (result.length == match_num)
                    return;
            }
        }
        let no_case = switch_upper_lower(s[pos]);
        if (no_case in branch) {
            let node = branch[no_case];
            if (node.vl) {
                let name = pre + no_case;
                let last = result.push({ name, value: node.vl }) - 1;
                if (name == s)
                    swap(result, 0, last);
                if (result.length == match_num)
                    return;
            }
            if (node.br) {
                match(s, pre + no_case, result, pos + 1, node.br);
                if (result.length == match_num)
                    return;
            }
        }
    }
}
function add_on(pre, result, branch) {
    for (let i in branch) {
        let node = branch[i];
        if (node.vl) {
            result.push({ name: pre + i, value: node.vl });
            if (result.length == match_num)
                return;
        }
        if (node.br) {
            add_on(pre + i, result, node.br);
            if (result.length == match_num)
                return;
        }
    }
}
function swap(array, i1, i2) {
    let temp = array[i1];
    array[i1] = array[i2];
    array[i2] = temp;
}
function switch_upper_lower(s) {
    let lower = s.toLowerCase();
    if (lower == s)
        return s.toUpperCase();
    else
        return lower;
}
