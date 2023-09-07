import { JSON } from '@klave/sdk';

@serializable
export class ErrorMessage {
    success!: boolean;
    message!: string;
}

@serializable
export class FxRateDataResult {
    EUR!: number;
    USD!: number;
    CHF!: number;
}

@serializable
export class FxRateData {
    base!: string;
    results!: FxRateDataResult;
    updated!: string;
}

@serializable
export class FxRateResult {
    success!: boolean;
    rates!: FxRateData;
}

