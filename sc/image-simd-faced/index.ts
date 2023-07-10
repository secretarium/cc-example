import { Notifier, Ledger, Context, JSON } from '@klave/sdk';
import { decode } from "as-base64/assembly/index";
import { GetParticipantsOutput, Participant, ParticipantInfo, VoteInput, VoteOutput, OwnContribOutput, ResultInsufficientOutput, ResultOutput, HelloOutput, PingOutput, ErrorMessage, ImageInfo } from './types';
import { unpackCascade, runCascade, clusterDetections } from './pico';
import { cascadeModel } from './model'

const participantsTableName = "image_simd_faced_v0";
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
export function getPicoResult(input: ImageInfo): void {

    const modelBytes = decode(cascadeModel);
    unpackCascade(modelBytes);

    const detsFromCascade = runCascade(input, {
        shiftfactor: 0.1,
        minsize: 20,
        maxsize: 1000,
        scalefactor: 1.1,
    })

    const detsFromClustering = clusterDetections(detsFromCascade, 0.2);
    
    // const qthresh = 5.0 // this constant is empirical: other cascades might require a different one
    // for (let i = 0; i < detsFromClustering.length; ++i)
    //     // check the detection score
    //     // if it's above the threshold, draw it
    //     if (detsFromClustering[i][3] > qthresh) {
    //         // Detected ...
    //     }

    Notifier.sendJson<ResultOutput>({
        success: true,
        detections: detsFromClustering
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
