import { JSON } from '@klave/sdk';

@serializable
export class ErrorMessage {
    success!: boolean;
    message!: string;
}

@serializable
export class FxRateData {
    base!: string;
    results!: Map<string, number>;
    updated!: string;
}

@serializable
export class FxRateResult {
    success!: boolean;
    rates!: FxRateData;
}

