import { Notifier, Ledger, Context, JSON } from '@klave/sdk';
import { decode } from "as-base64/assembly/index";
import { GetParticipantsOutput, Participant, ParticipantInfo, ResultOutput, HelloOutput, PingOutput, ImageInfo, DumbResultOutput, PicoModel, ResultInsufficientOutput } from './types';
import { unpackCascade, runCascade, clusterDetections } from './pico';

const participantsTableName = "image_simd_faced_v1";
const picoModelTableName = "pico_model_v0";
const noShowContribution = 0

/**
 * @transaction
 */
export function getPicoResult(input: ImageInfo): void {

    if (input.pixels.length === 0) {
        Notifier.sendJson<DumbResultOutput>({
            success: false,
            message: "No input"
        });
        return;
    }

    const picoModelTable = Ledger.getTable(picoModelTableName);
    const cascadeModel = picoModelTable.get('model');
    if (cascadeModel.length === 0) {
        Notifier.sendJson<DumbResultOutput>({
            success: false,
            message: "Empty model"
        });
        return;
    }

    Notifier.sendJson<DumbResultOutput>({
        success: true,
        message: 'Warming up...'
    });

    const modelBytes = decode(cascadeModel);
    const sArray = new Int8Array(modelBytes.length);
    for (let i = 0; i < modelBytes.length; ++i)
        sArray[i] = modelBytes[i];

    unpackCascade(sArray);

    Notifier.sendJson<DumbResultOutput>({
        success: true,
        message: 'Starting...'
    });

    const detsFromCascade = runCascade(input, {
        shiftfactor: 0.1,
        minsize: 20,
        maxsize: 1000,
        scalefactor: 1.1,
    })

    const detsFromClustering = clusterDetections(detsFromCascade, 0.2);
    const participantsTable = Ledger.getTable(participantsTableName)
    const list = participantsTable.get('list');

    if (list.length !== 0) {
        const existingParticipants = JSON.parse<Participant[]>(list);
        const which = existingParticipants.findIndex(function (p) { return p.id === Context.get('sender') });
        
        if (which !== -1) {
            existingParticipants[which].contribution = detsFromClustering.length;
            participantsTable.set('list', JSON.stringify<Participant[]>(existingParticipants));
        }
    }

    Notifier.sendJson<ResultOutput>({
        success: true,
        detections: detsFromClustering
    });
}

/**
 * @transaction
 */
export function setPicoModel(input: PicoModel): void {

    const picoModelTable = Ledger.getTable(picoModelTableName);
    picoModelTable.set('model', input.model.replaceAll('\n', '').replaceAll('\r', ''));

    Notifier.sendJson<DumbResultOutput>({
        success: true,
        message: "Model loaded"
    });
}

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
                contribution: p.contribution
            }
        })
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
