import { Notifier, JSON, Ledger, Subscription, Context } from '@klave/sdk';
import { WriteMessageOutput, ClearChatOutput, Chat, ChatMessage } from './types';

const chatRoomName = 'demo_chat';


/**
 * @transaction
 */
export function writeMessage(input: ChatMessage): void {

    const clientId = Context.get('sender');
    const newMessage: ChatMessage = {
        sender: clientId,
        message: input.message,
        timestamp: input.timestamp
    }

    const chatTable = Ledger.getTable(chatRoomName);
    const list = chatTable.get('messages');

    if (list.length === 0) {
        chatTable.set('messages', JSON.stringify<ChatMessage[]>([newMessage]));
    } else {
        const existingMessages = JSON.parse<ChatMessage[]>(list);
        existingMessages.push(newMessage);
        chatTable.set('messages', JSON.stringify<ChatMessage[]>(existingMessages));
    }

    Notifier.sendJson<WriteMessageOutput>({
        success: true,
        message: 'Done',
        clientId
    });

};

/**
 * @query
 */
export function getChat(): void {

    Subscription.setReplayStart();
    const chat = Ledger.getTable(chatRoomName).get('messages');
    if (chat.length === 0) {
        Notifier.sendJson<Chat>({
            messages: []
        });
        return;
    }

    const msgs = JSON.parse<ChatMessage[]>(chat);
    Notifier.sendJson<Chat>({
        messages: msgs
    });

};

/**
 * @transaction
 */
export function clearChat(): void {

    const chatTable = Ledger.getTable(chatRoomName);
    chatTable.set('messages', JSON.stringify<ChatMessage[]>([]));

    Notifier.sendJson<ClearChatOutput>({
        success: true,
        message: 'Done'
    });

};
