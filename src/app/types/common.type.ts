import * as v from 'valibot';

export const IconRef = v.variant('kind', [
  v.object({
    kind: v.literal('svg-path'),
    value: v.pipe(v.string(), v.endsWith('.svg')),
  }),
  v.object({
    kind: v.literal('ng-icon'),
    value: v.string(),
  }),
]);
export type IconRef = v.InferOutput<typeof IconRef>;

export const ProfileName = v.pipe(v.string(), v.minLength(1), v.maxLength(255));
export type ProfileName = v.InferOutput<typeof ProfileName>;
