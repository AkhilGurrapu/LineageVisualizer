import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core Database Objects - Similar to Snowflake
export const databases = pgTable("databases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // 'snowflake', 'postgres', 'mysql', etc.
  connectionString: text("connection_string"),
  description: text("description"),
  environment: text("environment").notNull(), // 'prod', 'staging', 'dev'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schemas = pgTable("schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  databaseId: varchar("database_id").notNull(),
  description: text("description"),
  schemaType: text("schema_type").notNull(), // 'raw', 'staging', 'analytics', 'marts'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_schema_per_db").on(table.databaseId, table.name)
]);

export const tables = pgTable("tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  schemaId: varchar("schema_id").notNull(),
  description: text("description"),
  tableType: text("table_type").notNull(), // 'table', 'view', 'materialized_view', 'external_table'
  dataClassification: text("data_classification"), // 'public', 'internal', 'confidential', 'restricted'
  rowCount: integer("row_count").default(0),
  sizeBytes: integer("size_bytes").default(0),
  lastRefreshed: timestamp("last_refreshed"),
  position: jsonb("position").notNull(), // {x: number, y: number}
  tags: jsonb("tags").default(sql`'[]'::jsonb`), // Array of tag strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_table_per_schema").on(table.schemaId, table.name),
  index("idx_table_type").on(table.tableType),
  index("idx_data_classification").on(table.dataClassification)
]);

export const columns = pgTable("columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tableId: varchar("table_id").notNull(),
  dataType: text("data_type").notNull(),
  isNullable: boolean("is_nullable").notNull().default(false),
  isPrimaryKey: boolean("is_primary_key").notNull().default(false),
  isForeignKey: boolean("is_foreign_key").notNull().default(false),
  defaultValue: text("default_value"),
  maxLength: integer("max_length"),
  precision: integer("precision"),
  scale: integer("scale"),
  ordinalPosition: integer("ordinal_position").notNull(),
  description: text("description"),
  dataClassification: text("data_classification"), // 'public', 'internal', 'confidential', 'restricted'
  isPii: boolean("is_pii").default(false),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_column_per_table").on(table.tableId, table.name),
  index("idx_column_data_type").on(table.dataType),
  index("idx_column_pii").on(table.isPii)
]);

// Column-Level Lineage with detailed transformation tracking
export const columnLineage = pgTable("column_lineage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceColumnId: varchar("source_column_id").notNull(),
  targetColumnId: varchar("target_column_id").notNull(),
  transformationType: text("transformation_type").notNull(), // 'direct', 'calculated', 'aggregated', 'filtered', 'joined'
  transformationLogic: text("transformation_logic"), // SQL or description of transformation
  dataQualityRules: jsonb("data_quality_rules").default(sql`'[]'::jsonb`),
  confidence: integer("confidence").default(100), // 0-100 confidence score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_column_lineage").on(table.sourceColumnId, table.targetColumnId),
  index("idx_source_column").on(table.sourceColumnId),
  index("idx_target_column").on(table.targetColumnId)
]);

// Table-Level Lineage
export const tableLineage = pgTable("table_lineage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceTableId: varchar("source_table_id").notNull(),
  targetTableId: varchar("target_table_id").notNull(),
  transformationType: text("transformation_type").notNull(), // 'direct', 'aggregation', 'join', 'union', 'filter'
  transformationLogic: text("transformation_logic"),
  executionFrequency: text("execution_frequency"), // 'real-time', 'hourly', 'daily', 'weekly', 'monthly'
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_table_lineage").on(table.sourceTableId, table.targetTableId),
  index("idx_source_table").on(table.sourceTableId),
  index("idx_target_table").on(table.targetTableId)
]);

// RBAC - Roles
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`), // Array of permission strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RBAC - Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RBAC - User Role Assignments
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  roleId: varchar("role_id").notNull(),
  assignedBy: varchar("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  uniqueIndex("unique_user_role").on(table.userId, table.roleId),
  index("idx_user_roles_user").on(table.userId),
  index("idx_user_roles_role").on(table.roleId)
]);

// Data Access Policies
export const dataAccessPolicies = pgTable("data_access_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  resourceType: text("resource_type").notNull(), // 'database', 'schema', 'table', 'column'
  resourceId: varchar("resource_id").notNull(),
  roleId: varchar("role_id").notNull(),
  permissions: jsonb("permissions").notNull(), // ['read', 'write', 'delete', 'admin']
  conditions: jsonb("conditions").default(sql`'{}'::jsonb`), // Row-level security conditions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_policy_resource").on(table.resourceType, table.resourceId),
  index("idx_policy_role").on(table.roleId)
]);

// Data Quality Monitoring
export const dataQualityRules = pgTable("data_quality_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // 'null_check', 'range_check', 'format_check', 'custom'
  resourceType: text("resource_type").notNull(), // 'table', 'column'
  resourceId: varchar("resource_id").notNull(),
  ruleDefinition: jsonb("rule_definition").notNull(),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dq_resource").on(table.resourceType, table.resourceId),
  index("idx_dq_severity").on(table.severity)
]);

// Data Quality Test Results
export const dataQualityResults = pgTable("data_quality_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").notNull(),
  testRunId: varchar("test_run_id").notNull(),
  status: text("status").notNull(), // 'passed', 'failed', 'warning'
  errorCount: integer("error_count").default(0),
  totalCount: integer("total_count").default(0),
  errorRate: integer("error_rate").default(0), // Percentage
  executedAt: timestamp("executed_at").defaultNow(),
  details: jsonb("details").default(sql`'{}'::jsonb`),
}, (table) => [
  index("idx_dq_results_rule").on(table.ruleId),
  index("idx_dq_results_run").on(table.testRunId),
  index("idx_dq_results_status").on(table.status)
]);

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Projects for organizing data assets
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  modelCount: integer("model_count").notNull().default(0),
  sourceCount: integer("source_count").notNull().default(0),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define Relations
export const databaseRelations = relations(databases, ({ many }) => ({
  schemas: many(schemas),
}));

export const schemaRelations = relations(schemas, ({ one, many }) => ({
  database: one(databases, {
    fields: [schemas.databaseId],
    references: [databases.id],
  }),
  tables: many(tables),
}));

export const tableRelations = relations(tables, ({ one, many }) => ({
  schema: one(schemas, {
    fields: [tables.schemaId],
    references: [schemas.id],
  }),
  columns: many(columns),
  sourceLineages: many(tableLineage, { relationName: "sourceTable" }),
  targetLineages: many(tableLineage, { relationName: "targetTable" }),
}));

export const columnRelations = relations(columns, ({ one, many }) => ({
  table: one(tables, {
    fields: [columns.tableId],
    references: [tables.id],
  }),
  sourceLineages: many(columnLineage, { relationName: "sourceColumn" }),
  targetLineages: many(columnLineage, { relationName: "targetColumn" }),
}));

export const columnLineageRelations = relations(columnLineage, ({ one }) => ({
  sourceColumn: one(columns, {
    fields: [columnLineage.sourceColumnId],
    references: [columns.id],
    relationName: "sourceColumn",
  }),
  targetColumn: one(columns, {
    fields: [columnLineage.targetColumnId],
    references: [columns.id],
    relationName: "targetColumn",
  }),
}));

export const tableLineageRelations = relations(tableLineage, ({ one }) => ({
  sourceTable: one(tables, {
    fields: [tableLineage.sourceTableId],
    references: [tables.id],
    relationName: "sourceTable",
  }),
  targetTable: one(tables, {
    fields: [tableLineage.targetTableId],
    references: [tables.id],
    relationName: "targetTable",
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  projects: many(projects),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  dataAccessPolicies: many(dataAccessPolicies),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const projectRelations = relations(projects, ({ one }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertDatabaseSchema = createInsertSchema(databases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchemaSchema = createInsertSchema(schemas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertColumnSchema = createInsertSchema(columns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertColumnLineageSchema = createInsertSchema(columnLineage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTableLineageSchema = createInsertSchema(tableLineage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
});

export const insertDataAccessPolicySchema = createInsertSchema(dataAccessPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataQualityRuleSchema = createInsertSchema(dataQualityRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select Types
export type Database = typeof databases.$inferSelect;
export type Schema = typeof schemas.$inferSelect;
export type Table = typeof tables.$inferSelect;
export type Column = typeof columns.$inferSelect;
export type ColumnLineage = typeof columnLineage.$inferSelect;
export type TableLineage = typeof tableLineage.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type DataAccessPolicy = typeof dataAccessPolicies.$inferSelect;
export type DataQualityRule = typeof dataQualityRules.$inferSelect;
export type DataQualityResult = typeof dataQualityResults.$inferSelect;
export type Project = typeof projects.$inferSelect;

// Insert Types
export type InsertDatabase = z.infer<typeof insertDatabaseSchema>;
export type InsertSchema = z.infer<typeof insertSchemaSchema>;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type InsertColumn = z.infer<typeof insertColumnSchema>;
export type InsertColumnLineage = z.infer<typeof insertColumnLineageSchema>;
export type InsertTableLineage = z.infer<typeof insertTableLineageSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertDataAccessPolicy = z.infer<typeof insertDataAccessPolicySchema>;
export type InsertDataQualityRule = z.infer<typeof insertDataQualityRuleSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Additional useful types for API responses
export type TableWithSchema = Table & {
  schema: Schema & {
    database: Database;
  };
};

export type ColumnWithTable = Column & {
  table: TableWithSchema;
};

export type ColumnLineageWithDetails = ColumnLineage & {
  sourceColumn: ColumnWithTable;
  targetColumn: ColumnWithTable;
};

export type UserWithRoles = User & {
  userRoles: (UserRole & {
    role: Role;
  })[];
};
