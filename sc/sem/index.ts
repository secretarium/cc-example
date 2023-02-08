@external("env", "notify")
    declare function notify(s: ArrayBuffer): i32;
@external("env", "add_user_query")
    declare function add_user_query(s: ArrayBuffer): void;
@external("env", "add_user_transaction")
    declare function add_user_transaction(s: ArrayBuffer): void; 

export function register_routes(): void {
    add_user_query(String.UTF8.encode("my_query", true));
    add_user_transaction(String.UTF8.encode("my_transaction", true));
}

export function my_query(arg: ArrayBuffer): void {
    let s: string = String.UTF8.decode(arg, true);
    notify(String.UTF8.encode("Hello " + s, true))
}
export function my_transaction(arg: ArrayBuffer): void {
    let s: string = String.UTF8.decode(arg, true);
    notify(String.UTF8.encode("Hello " + s, true))
}
