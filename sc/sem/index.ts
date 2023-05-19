import { Notifier, Ledger, ptr2string, JSON } from '@klave/sdk';
// import { readLedger, writeLedger, ptr2string } from './utils';

@json
class MissingKeyMessage {
    success!: boolean;
    message!: string;
}

@json
class FetchInput {
    key!: string;
}

const myTableName = "my_table";

/**
 * @query
 * @param arg - a pointer to a null-terminated c string located in linear memory
 */
export function fetchValue(arg: i32): void {
    const input = JSON.parse<FetchInput>(ptr2string(arg));
    // let k = ptr2string(arg);
    let v = Ledger.getTable(myTableName).get(input.key);
    // let v = readLedger("my_table", input.key);
    if (v.length == 0){
        const toto = JSON.stringify<MissingKeyMessage>({
            success: false,
            message: `key '${input.key}' not found in table`
        })
        Notifier.notify(String.UTF8.encode(toto, true));
        // Notifier.notify(String.UTF8.encode("{\"success\": false,\"message\": \"" + "key '" + k + "' not found in table \" }", true));
   } else
        Notifier.notify(String.UTF8.encode("{\"success\": \"ok\",\"" + input.key + "\": \"" + v + "\" }", true));
}

/**
 * @transaction
 * @param arg - a pointer to a null-terminated c string located in linear memory
 */
export function storeValue(arg: i32): void {
    const s = ptr2string(arg);
    const params = s.split('=');
    if (params.length !== 2)
        Notifier.notify(String.UTF8.encode("{\"success\": false, \"message\":\"Missing arguments\" }", true));
    else {
        Ledger.getTable("my_table").set(params[0], params[1]);
        // writeLedger("my_table", params[0], params[1]);
        Notifier.notify(String.UTF8.encode("{\"success\": true }", true));
    }
}
