import * as v from 'valibot';
import { IconRef } from './common.type';
import { ProjectID } from './project.type';

export const CardID = v.pipe(v.string(), v.ulid());
export type CardID = v.InferOutput<typeof CardID>;

// ----- Kinds ----- //
export const CardKind = v.picklist(['single', 'weekly'] as const);
export type CardKind = v.InferOutput<typeof CardKind>;

// ----- Shared ----- //
const CardBase = {
  id: CardID,
  projectId: ProjectID,
  createdAt: v.pipe(v.string(), v.isoDateTimeSecond()),
  updatedAt: v.pipe(v.string(), v.isoDateTimeSecond()),
  revision: v.pipe(v.number(), v.minValue(0)),
};

// ----- Single ----- //
const ContentSingle = v.object({
  reportTime: v.pipe(v.string(), v.isoDate()),
  kicker: v.pipe(v.string(), v.minLength(1), v.maxLength(9)),
  titlePrefix: v.pipe(v.string(), v.minLength(1), v.maxLength(9)),
  titleMain: v.pipe(v.string(), v.minLength(1), v.maxLength(9)),
  summary: v.pipe(v.string(), v.minLength(10), v.maxLength(100)),
  imageSources: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(3)),
});

// ----- Weekly ----- //
const ItemWeekly = v.object({
  title: v.pipe(v.string(), v.length(4)),
  subtitle: v.pipe(v.string(), v.minLength(4), v.maxLength(15)),
  summary: v.pipe(v.string(), v.minLength(25), v.maxLength(55)),
  icon: IconRef,
});

const ContentWeekly = v.object({
  reportTime: v.pipe(v.string(), v.isoDate()),
  news: v.pipe(v.array(ItemWeekly), v.minLength(1), v.maxLength(7)),
});

// ----- Card ----- //
export const CardRecord = v.variant('kind', [
  v.object({
    ...CardBase,
    kind: v.literal('weekly'),
    content: ContentWeekly,
  }),
  v.object({
    ...CardBase,
    kind: v.literal('single'),
    content: ContentSingle,
  }),
]);

export type CardRecord = v.InferOutput<typeof CardRecord>;
