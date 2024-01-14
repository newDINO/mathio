export declare class MathIO {
    private cursor;
    private completing;
    private completing_e1;
    private completing_e2;
    private _root_node;
    private _container;
    get container(): HTMLElement;
    get root_node(): MathMLElement;
    private _warn_handle;
    set warn_handle(handle: (warning: string) => void);
    private _vertical_fraction;
    set vertical_fraction(setting: boolean);
    private _bold;
    get bold(): boolean;
    set bold(value: boolean);
    constructor();
    private warn;
    to_ml_text(): string;
    on_pointerdown(event: PointerEvent): void;
    on_key(key: string): void;
    private start_completing;
    private stop_completing;
    private refresh_completing;
    private on_complete_key;
    private resize_cursor;
    private on_enter;
    private on_bra;
    private on_space;
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
    private on_root;
}
