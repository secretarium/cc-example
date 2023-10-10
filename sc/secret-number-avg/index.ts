import { Notifier, Ledger, Context, JSON, HTTP, HttpRequest, HttpResponse } from '@klave/sdk';
import { GetParticipantsOutput, Participant, ParticipantInfo, VoteInput, VoteOutput, OwnContribOutput, ResultInsufficientOutput, ResultOutput, HelloOutput, PingOutput, ErrorMessage, HttpResultMessage } from './types';

const participantsTableName = "secret_na_participants_v5";
const noShowContribution = -999

/**
 * @query
 */
export function getParticipants(): void {

    const list = Ledger.getTable(participantsTableName).get('list');
    if (list.length === 0) {
        Notifier.sendJson<GetParticipantsOutput>({
            participants: []
        });
        return;
    }

    const participants = JSON.parse<Participant[]>(list);
    Notifier.sendJson<GetParticipantsOutput>({
        participants: participants.map<ParticipantInfo>(function (p) {
            return {
                id: p.id,
                name: p.name,
                hasContributed: p.contribution !== noShowContribution
            }
        })
    });
}

/**
 * @query
 */
export function getResult(): void {

    const list = Ledger.getTable(participantsTableName).get('list');
    if (list.length === 0) {
        Notifier.sendJson<ResultInsufficientOutput>({
            success: false,
            message: 'Insufficient number of contributions'
        });
        return;
    }

    Notifier.sendJson<ResultOutput>({
        success: true,
        average: 42
    });

    // const participants = JSON.parse<Participant[]>(list);
    // const contributingParticipants = participants.filter(function (p) { return p.contribution !== noShowContribution })
    // if (contributingParticipants.length < 3) {
    //     Notifier.sendJson<ResultInsufficientOutput>({
    //         success: false,
    //         message: 'Insufficient number of contributions'
    //     });
    //     return;
    // }

    // const avg = participants.reduce(function (acc: f64, p) { return acc + <f64>p.contribution }, <f64>0) / participants.length;
    // Notifier.sendJson<ResultOutput>({
    //     success: true,
    //     average: avg
    // });
}

/**
 * @query
 */
export function getOwnContribution(): void {

    const participantsTable = Ledger.getTable(participantsTableName)

    const list = participantsTable.get('list');
    if (list.length === 0) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `There was an issue processing your request`
        });
        return;
    }

    const existingParticipants = JSON.parse<Participant[]>(list);
    const which = existingParticipants.findIndex(function (p) {
        return p.id === Context.get('sender')
    });
    if (which === -1) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `There was an issue processing your request`
        });
        return;
    }

    const client = existingParticipants[which]

    Notifier.sendJson<OwnContribOutput>({
        success: true,
        contribution: client.contribution
    });
}

/**
 * @transaction
 */
export function vote(input: VoteInput): void {

    const participantsTable = Ledger.getTable(participantsTableName)

    const list = participantsTable.get('list');
    if (list.length === 0) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `There was an issue processing your request`
        });
        return;
    }

    const existingParticipants = JSON.parse<Participant[]>(list);
    const which = existingParticipants.findIndex(function (p) { return p.id === Context.get('sender') });
    if (which === -1) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `There was an issue processing your request`
        });
        return;
    }

    existingParticipants[which].contribution = input.contribution;
    participantsTable.set('list', JSON.stringify<Participant[]>(existingParticipants));

    Notifier.sendJson<VoteOutput>({
        success: true
    });
}

/**
 * @transaction
 */
export function hello(): void {

    const clientId = Context.get('sender');
    const newParticipant: Participant = {
        id: clientId,
        name: 'Anonymous',
        visible: false,
        contribution: noShowContribution
    }

    const participantsTable = Ledger.getTable(participantsTableName)
    const list = participantsTable.get('list');

    if (list.length === 0) {
        participantsTable.set('list', JSON.stringify<Participant[]>([newParticipant]));
    } else {
        const existingParticipants = JSON.parse<Participant[]>(list);
        if (existingParticipants.findIndex(function (p) {
            const clientId = Context.get('sender')
            return p.id === clientId
        }) === -1) {
            existingParticipants.push(newParticipant);
            participantsTable.set('list', JSON.stringify<Participant[]>(existingParticipants));
        }
    }

    Notifier.sendJson<HelloOutput>({
        success: true,
        clientId
    });
}

/**
 * @query
 */
export function ping(): void {
    const clientId = Context.get('sender')
    Notifier.sendJson<PingOutput>({
        pong: true,
        you: clientId
    });
}

/**
 * @query
 */
export function httpsRequest(url: string): void {
    const scheme = 'https://';
    if (!url.startsWith(scheme)) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `only https queries are supported, ${url} doesn't start with 'https://'`
        });
        return;
    }
    const hostAndPath = url.substring(scheme.length);
    let pos = hostAndPath.indexOf('/');
    const hostAndPort = pos == -1 ? hostAndPath : hostAndPath.substring(0, pos);
    const path = pos == -1 ? '' : hostAndPath.substring(pos);
    pos = hostAndPort.indexOf(':');
    const host = pos == -1 ? hostAndPort : hostAndPort.substring(0, pos);
    const port = pos == -1 ? 443 : parseInt(hostAndPort.substring(pos + 1)) as i32;
    const query: HttpRequest = {
        hostname: host,
        port,
        path,
        headers: [],
        body: '',
    };

    const respBuff = HTTP.requestAsArrayBuffer(query);
    if (respBuff === null) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `HTTP call went wrong !`
        });
        return;
    }
    const compRes = String.UTF8.decode(respBuff, true)
    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: compRes
    }); 

    const response = JSON.parse<HttpResponse>(compRes)
    if (!response)
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `HTTP call went wrong !`
        });
    else {
        Notifier.sendJson<HttpResultMessage>({
            success: true,
            response
        });
    }
};

/**
 * @query
 */
export function https(url: string): void {
    const scheme = 'https://';
    if (!url.startsWith(scheme)) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `only https queries are supported, ${url} doesn't start with 'https://'`
        });
        return;
    }
    const hostAndPath = url.substring(scheme.length);
    let pos = hostAndPath.indexOf('/');
    const hostAndPort = pos == -1 ? hostAndPath : hostAndPath.substring(0, pos);
    const path = pos == -1 ? '' : hostAndPath.substring(pos);
    pos = hostAndPort.indexOf(':');
    const host = pos == -1 ? hostAndPort : hostAndPort.substring(0, pos);
    const port = pos == -1 ? 443 : parseInt(hostAndPort.substring(pos + 1)) as i32;
    const query: HttpRequest = {
        hostname: host,
        port,
        path,
        headers: [],
        body: '',
    };
    const response = HTTP.request(query);
    if (!response)
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `HTTP call went wrong !`
        });
    else {
        Notifier.sendJson<HttpResultMessage>({
            success: true,
            response
        });
    }
};