export declare class MathIO {
    private cursor;
    private completing;
    private completing_text;
    private _root_node;
    get root_node(): MathMLElement;
    private _warn_handle;
    set warn_handle(handle: (warning: string) => void);
    private _vertical_fraction;
    set vertical_fraction(setting: boolean);
    constructor();
    private warn;
    on_pointerdown(event: PointerEvent): void;
    on_key(key: string): void;
    private start_completing;
    private on_complete_key;
    private resize_cursor;
    private on_arrow_up;
    private on_arrow_down;
    private on_arrow_right;
    private on_arrow_left;
    private on_backspace;
    private on_subscript;
    private on_superscript;
    private on_fraction;
    private on_num;
    private on_char;
}
