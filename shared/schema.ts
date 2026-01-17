import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  layoutConfig: jsonb("layout_config").$type<{
    front: { scale: number; position: [number, number, number]; rotation: [number, number, number] };
    back: { scale: number; position: [number, number, number]; rotation: [number, number, number] };
    left: { scale: number; position: [number, number, number]; rotation: [number, number, number] };
    right: { scale: number; position: [number, number, number]; rotation: [number, number, number] };
    syncOffsets: { front: number; back: number; left: number; right: number };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// API Types
export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;

export interface SeiMetadata {
  timestamp: string;
  speed?: string;
  gear?: string;
  latitude?: string;
  longitude?: string;
  brake?: string;
  accelerator?: string;
  turn_signal?: string;
  [key: string]: any;
}
