import { JSON } from '@klave/sdk';

@serializable
export class ErrorMessage {
    success!: boolean;
    message!: string;
}

// @ts-ignore
@serializable
export class FxRateDataResult {
    EUR!: number;
    GBP!: number;
    CHF!: number;
}

// @ts-ignore
@serializable
export class FxRateData {
    base!: string;
    results!: FxRateDataResult;
    updated!: string;
}

// @ts-ignore
@serializable
export class FxRateResult {
    success!: boolean;
    rates!: FxRateData;
}

