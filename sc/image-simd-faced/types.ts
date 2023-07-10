import { JSON } from '@klave/sdk';


@serializable
export class CascadeParams {
    shiftfactor!: f64;
    minsize!: i32;
    maxsize!: i32;
    scalefactor!: f64;
}

@serializable
export class ImageInfo {
    pixels!: i32[];
    nrows!: i32;
    ncols!: i32;
    ldim!: i32;
}

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
    detections!: f64[][];
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
