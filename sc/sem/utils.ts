import { Ledger } from '@klave/sdk';

// assume always string key/value (but the external function could handle arbitrary buffers, including with \0 inside)
export function readLedger(table: string, key: string): string {
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
}

export function writeLedger(table: string, key: string, value: string): i32 {
    let t = String.UTF8.encode(table, true);
    let k = String.UTF8.encode(key, true);
    let v = String.UTF8.encode(value, true);
    return Ledger.writeToTable(t, k, v);
    // PLOP
}

// assumes ptr is a pointer to a null-terminated c string located in linear memory
export function ptr2string(ptr: i32): string {
    let len = 0;
    while (load<u8>(ptr + len) != 0)
        len++;
    let buf = new ArrayBuffer(len + 1);
    memory.copy(changetype<usize>(buf), ptr, len + 1);
    return String.UTF8.decode(buf, true);
}