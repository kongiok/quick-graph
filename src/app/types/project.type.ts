import * as v from 'valibot';
import { CardID } from './card.type';
import { ProfileID } from './common.type';

export const ProjectID = v.pipe(v.string(), v.ulid());

export type ProjectID = v.InferOutput<typeof ProjectID>;

export const ProjectRecord = v.object({
  id: ProjectID,
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  userId: ProfileID,
  createdAt: v.pipe(v.string(), v.isoDateTimeSecond()),
  updatedAt: v.pipe(v.string(), v.isoDateTimeSecond()),
});


export type ProjectRecord = v.InferOutput<typeof ProjectRecord>;
