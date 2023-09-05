import { Notifier, JSON, HTTP, HttpRequest } from '@klave/sdk';
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
            message: `HTTP call went wrong !`
        });
        return;
    }

    Notifier.sendJson<ErrorMessage>({
        success: true,
        message: response.body
    });

    const ratesData = JSON.parse<FxRateData>(response.body);
    Notifier.sendJson<FxRateResult>({
        success: true,
        rates: ratesData
    });
};