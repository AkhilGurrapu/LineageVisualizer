import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tables = pgTable("tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  schema: text("schema").notNull(),
  database: text("database").notNull(),
  description: text("description"),
  tableType: text("table_type").notNull(), // 'source', 'staging', 'analytics', etc.
  position: jsonb("position").notNull(), // {x: number, y: number}
});

export const columns = pgTable("columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dataType: text("data_type").notNull(),
  isNullable: boolean("is_nullable").notNull().default(false),
  isPrimaryKey: boolean("is_primary_key").notNull().default(false),
  isForeignKey: boolean("is_foreign_key").notNull().default(false),
  tableId: varchar("table_id").notNull(),
  description: text("description"),
  ordinalPosition: integer("ordinal_position").notNull(),
});

export const lineageConnections = pgTable("lineage_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceTableId: varchar("source_table_id").notNull(),
  sourceColumnId: varchar("source_column_id"),
  targetTableId: varchar("target_table_id").notNull(),
  targetColumnId: varchar("target_column_id"),
  transformationType: text("transformation_type").notNull(), // 'direct', 'aggregation', 'join', etc.
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  modelCount: integer("model_count").notNull().default(0),
  sourceCount: integer("source_count").notNull().default(0),
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
});

export const insertColumnSchema = createInsertSchema(columns).omit({
  id: true,
});

export const insertLineageConnectionSchema = createInsertSchema(lineageConnections).omit({
  id: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tables.$inferSelect;
export type InsertColumn = z.infer<typeof insertColumnSchema>;
export type Column = typeof columns.$inferSelect;
export type InsertLineageConnection = z.infer<typeof insertLineageConnectionSchema>;
export type LineageConnection = typeof lineageConnections.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
