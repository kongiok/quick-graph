import { InferOutput, picklist } from 'valibot';

export const ProcessSteps = picklist(['TITLE', 'ENTER', 'VALIDATE' as const]);
export type ProcessSteps = InferOutput<typeof ProcessSteps>;
