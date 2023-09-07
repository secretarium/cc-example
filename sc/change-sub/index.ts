import { Notifier, JSON, Ledger, Subscription } from '@klave/sdk';
import { ErrorMessage, KVInput } from './types';

/**
 * @query
 */
export function readValue(): void {

    Subscription.setReplayStart();
    const text = Ledger.getTable('messages').get('text')

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: text
    });
};

/**
 * @transaction
 */
export function setValue(input: KVInput): void {

    const text = Ledger.getTable('messages').set(input.key, input.value)

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: 'Done'
    });
};
