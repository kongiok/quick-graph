import { Dexie, type Table } from "dexie"
import { ProfileID, ProfileRecord } from "../types/common.type";
import { ProjectID, ProjectRecord } from "../types/project.type";
import { CardID, CardRecord } from "../types/card.type";

export const db = new Dexie("Graph") as Dexie & {
  users: Table<ProfileRecord, ProfileID>
  projects: Table<ProjectRecord, ProjectID>;
  cards: Table<CardRecord, CardID>;
};
db.version(1).stores({
  users: 'id, name',
  projects: 'id, userId, updatedAt, createdAt',
  cards: 'id, projectId, kind, updatedAt, [projectId+updatedAt]',
});
