import { Notifier, JSON, HTTP, HttpRequest, Crypto } from '@klave/sdk';
import { ErrorMessage, FxRateData, FxRateResult } from './types';

/**
 * @query
 */
export function grabFxRates(): void {

    const query: HttpRequest = {
        hostname: 'fx.monilytics.org',
        port: 443,
        path: '/?from=USD&to=EUR,GBP,CHF',
        headers: [],
        body: ''
    };

    const response = HTTP.request(query);
    if (!response) {
        Notifier.sendJson<ErrorMessage>({
            success: false,
            message: `HTTP call went wrong`
        });
        return;
    }

    const ratesData = JSON.parse<FxRateData>(response.body);
    Notifier.sendJson<FxRateResult>({
        success: true,
        rates: ratesData
    });
};

// @ts-ignore
@serializable
export class DigestResult {
    success!: boolean;
    original!: string;
    digest!: u8[];
}


/**
 * @query
 */
export function getDigest(input: string): void {

    Notifier.sendJson<DigestResult>({
        success: true,
        original: input,
        digest: Crypto.SHA.digest(input)
    });
};