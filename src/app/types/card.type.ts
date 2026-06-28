import * as v from 'valibot';
import { IconRef } from './common.type';
import { ProjectID } from './project.type';

export const CardID = v.pipe(v.string(), v.ulid());
export type CardID = v.InferOutput<typeof CardID>;
// ----- Kinds ----- //
export const CardKind = v.picklist(['single', 'weekly'] as const);
export type CardKind = v.InferOutput<typeof CardKind>;

const ContentSingle = v.object({
  reportTime: v.pipe(v.string(), v.isoDate()),
  kicker: v.pipe(v.string(), v.minLength(1), v.maxLength(9)), // Headline for Title page.
  titlePrefix: v.pipe(v.string(), v.minLength(1), v.maxLength(9)),
  titleMain: v.pipe(v.string(), v.minLength(1), v.maxLength(9)),
  summary: v.pipe(v.string(), v.minLength(10), v.maxLength(100)),
  imgSources: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(3)),
});

const ItemWeekly = v.object({
  title: v.pipe(v.string(), v.length(4)),
  subtitle: v.pipe(v.string(), v.minLength(4), v.maxLength(15)),
  summary: v.pipe(v.string(), v.minLength(25), v.maxLength(55)),
  icon: IconRef,
});

const ContentWeekly = v.object({
  reportTime: v.pipe(v.string(), v.isoDate()),
  news: v.array(ItemWeekly),
});

export const CardInfo = v.object({
  id: CardID,
  projectId: ProjectID,
  revision: v.pipe(v.string(), v.isoDateTime()),
  updatedAt: v.pipe(v.string(), v.isoDateTimeSecond()),
});

export const Card = v.variant('kind', [
  v.object({
    kind: v.literal('weekly'),
    content: ContentWeekly,
    ...CardInfo.entries,
  }),
  v.object({
    kind: v.literal('single'),
    content: ContentSingle,
    ...CardInfo.entries,
  }),
]);

export type Card = v.InferOutput<typeof Card>;
