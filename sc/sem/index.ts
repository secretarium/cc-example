import { Router, Ledger, Notifier } from '@klave/sdk';

export function register_routes(): void {
    Router.addQuery(String.UTF8.encode("fetchValue", true));
    Router.addTransaction(String.UTF8.encode("storeValue", true));
}

export function fetchValue(arg: i32): void {
    let k = ptr2string(arg);
    let v = readLedger("my_table", k);
    if (v.length == 0)
        Notifier.notify(String.UTF8.encode("{\"success\": false,\"message\": \"" + "key '" + k + "' not found in table \" }", true));
    else
        Notifier.notify(String.UTF8.encode("{\"success\": \"ok\",\"" + k + "\": \"" + v + "\" }", true));
}

export function storeValue(arg: i32): void {
    const s = ptr2string(arg);
    const params = s.split('=');
    if (params.length !== 2)
        Notifier.notify(String.UTF8.encode("{\"success\": false, \"message\":\"Missing arguments\" }", true));
    else {
        writeLedger("my_table", params[0], params[1]);
        Notifier.notify(String.UTF8.encode("{\"success\": true }", true));
    }
}

// assume always string key/value (but the external function could handle arbitrary buffers, including with \0 inside)
function readLedger(table: string, key: string): string {
    let t = String.UTF8.encode(table, true);
    let k = String.UTF8.encode(key, true);
    let value = new ArrayBuffer(64);  
    let result = Ledger.readFromTableIntoBuffer(t, k, value);
    if (result < 0)
        return ""; // todo : report error (or not found ?)
    if (result > value.byteLength) {
        // buffer not big enough, retry with a properly sized one
        value = new ArrayBuffer(result);
        result = Ledger.readFromTableIntoBuffer(t, k, value);
        if (result < 0)
            return ""; // todo : report errors
    }
    return String.UTF8.decode(value, true);
    // DFL PLOP    LK
}

function writeLedger(table: string, key: string, value: string): i32 {
    let t = String.UTF8.encode(table, true);
    let k = String.UTF8.encode(key, true);
    let v = String.UTF8.encode(value, true);
    return Ledger.writeToTable(t, k, v);      
    // PLOP
}

// assumes ptr is a pointer to a null-terminated c string located in linear memory
function ptr2string(ptr: i32): string {
    let len = 0;
    while (load<u8>(ptr + len) != 0)
        len++;
    let buf = new ArrayBuffer(len + 1);
    memory.copy(changetype<usize>(buf), ptr, len + 1);
    return String.UTF8.decode(buf, true);
}


// @external("env", "notify")
//     declare function notify(s: ArrayBuffer): i32;
// @external("env", "add_user_query")
//     declare function add_user_query(s: ArrayBuffer): void;
// @external("env", "add_user_transaction")
//     declare function add_user_transaction(s: ArrayBuffer): void;

// export function register_routes(): void {
//     add_user_query(String.UTF8.encode("my_query", true));
//     add_user_transaction(String.UTF8.encode("my_transaction", true));
// }

// export function my_query(arg: ArrayBuffer): void {
//     let s: string = String.UTF8.decode(arg, true);
//     notify(String.UTF8.encode("Hello " + s, true))
// }
// export function my_transaction(arg: ArrayBuffer): void {
//     let s: string = String.UTF8.decode(arg, true);
//     notify(String.UTF8.encode("Hello " + s, true))
// }
