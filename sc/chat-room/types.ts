import { JSON } from '@klave/sdk';


// @ts-ignore
@serializable
export class ChatMessage {
    sender!: string;
    message!: string;
    timestamp!: string;
}

// @ts-ignore
@serializable
export class Chat {
    messages!: ChatMessage[];
}

// @ts-ignore
@serializable
export class WriteMessageOutput {
    success!: boolean;
    message!: string;
    clientId!: string;
}

// @ts-ignore
@serializable
export class ClearChatOutput {
    success!: boolean;
    message!: string;
}

// @ts-ignore
@serializable
export class KVInput {
    key!: string;
    value!: string;
}