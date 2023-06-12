import { JSON } from '@klave/sdk';

@serializable
export class Participant {
    id!: string;
    name!: string;
    visible!: boolean;
    contribution!: number;
}

@serializable
export class ParticipantInfo {
    id!: string;
    name!: string;
    hasContributed!: boolean;
}

@serializable
export class GetParticipantsOutput {
    participants!: ParticipantInfo[];
}

@serializable
export class VoteInput {
    contribution!: number;
}

@serializable
export class VoteOutput {
    success!: boolean;
}

@serializable
export class ResultInsufficientOutput {
    success!: boolean;
    message!: string;
}

@serializable
export class ResultOutput {
    success!: boolean;
    average!: number;
}

@serializable
export class OwnContribOutput {
    success!: boolean;
    contribution!: number;
}

@serializable
export class HelloOutput {
    success!: boolean;
    clientId!: string;
}

@serializable
export class PingOutput {
    pong!: boolean;
    you!: string;
}

@serializable
export class ErrorMessage {
    success!: boolean;
    message!: string;
}
