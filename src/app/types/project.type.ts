import * as v from 'valibot';
import { CardID } from './card.type';

export const ProjectID = v.pipe(v.string(), v.ulid());

export type ProjectID = v.InferOutput<typeof ProjectID>;

export const Project = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  cardIds: v.array(CardID),
  createdAt: v.pipe(v.string(), v.isoDateTimeSecond()),
  updatedAt: v.pipe(v.string(), v.isoDateTimeSecond()),
});

export type Project = v.InferOutput<typeof Project>;
