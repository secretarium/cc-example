import { Notifier, Ledger, Context, JSON } from '@klave/sdk';
import { GetParticipantsOutput, Participant, VoteInput, VoteOutput, ResultInsufficientOutput, ResultOutput, HelloOutput, PingOutput, ErrorMessage } from './types';

const participantsTableName = "participants_v0";
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
        participants: participants.map(p => ({
            id: p.id,
            name: p.name,
            hasContributed: p.contribution !== noShowContribution
        }))
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

    const participants = JSON.parse<Participant[]>(list);
    const contributingParticipants = participants.filter(p => p.contribution !== noShowContribution)
    if (contributingParticipants.length < 3) {
        Notifier.sendJson<ResultInsufficientOutput>({
            success: false,
            message: 'Insufficient number of contributions'
        });
        return;
    }

    const avg = participants.reduce((acc, p) => acc + p.contribution, 0) / participants.length;
    Notifier.sendJson<ResultOutput>({
        success: true,
        average: avg
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
    const which = existingParticipants.findIndex(p => p.id === Context.get('sender'));
    if (which === -1) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `There was an issue processing your request`
        });
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
        if (existingParticipants.findIndex(p => p.id === clientId) === -1) {
            existingParticipants.push(newParticipant);
            participantsTable.set('list', JSON.stringify<Participant[]>([newParticipant]));
        }
    }

    Notifier.sendJson<HelloOutput>({
        success: true
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
