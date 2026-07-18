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

export const ProfileName = v.pipe(
  v.string(),
  v.trim(),
  v.transform((input) => input.replace(/\s+/g, ' ')),
  v.nonEmpty('名字不能為空'),
  v.maxLength(20, '名字不能超過 20 個字'),
  v.regex(/^[\p{L}\p{N}_\- ]+$/u, '名字只能包含文字、數字、空白、底線或連字號')
);
export type ProfileName = v.InferOutput<typeof ProfileName>;

export const ProfileID = v.pipe(v.string(), v.uuid())
export type ProfileID = v.InferOutput<typeof ProfileID>;

export const ProfileRecord = v.object({
  id: ProfileID,
  name: ProfileName,
})
export type ProfileRecord = v.InferOutput<typeof ProfileRecord>;
