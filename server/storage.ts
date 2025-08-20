import { db } from "./db";
import { 
  databases, schemas, tables, columns, columnLineage, tableLineage,
  users, roles, userRoles, dataAccessPolicies, dataQualityRules, projects,
  type Database, type Schema, type Table, type Column, type ColumnLineage, type TableLineage,
  type User, type Role, type UserRole, type DataAccessPolicy, type DataQualityRule, type Project,
  type InsertDatabase, type InsertSchema, type InsertTable, type InsertColumn, 
  type InsertColumnLineage, type InsertTableLineage, type InsertUser, type InsertRole,
  type InsertUserRole, type InsertDataAccessPolicy, type InsertDataQualityRule, type InsertProject,
  type TableWithSchema, type ColumnWithTable, type ColumnLineageWithDetails, type UserWithRoles
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

// Storage Interface - defines all operations
export interface IStorage {
  // Database Operations
  getDatabases(): Promise<Database[]>;
  getDatabase(id: string): Promise<Database | undefined>;
  createDatabase(database: InsertDatabase): Promise<Database>;

  // Schema Operations
  getSchemas(databaseId?: string): Promise<Schema[]>;
  getSchema(id: string): Promise<Schema | undefined>;
  createSchema(schema: InsertSchema): Promise<Schema>;

  // Table Operations
  getTables(schemaId?: string): Promise<Table[]>;
  getTablesWithSchema(): Promise<TableWithSchema[]>;
  getTable(id: string): Promise<Table | undefined>;
  getTableWithSchema(id: string): Promise<TableWithSchema | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: string, updates: Partial<Table>): Promise<Table | undefined>;

  // Column Operations
  getColumnsByTableId(tableId: string): Promise<Column[]>;
  getColumnsWithTable(tableId: string): Promise<ColumnWithTable[]>;
  getColumn(id: string): Promise<Column | undefined>;
  createColumn(column: InsertColumn): Promise<Column>;

  // Column Lineage Operations
  getColumnLineage(): Promise<ColumnLineage[]>;
  getColumnLineageWithDetails(): Promise<ColumnLineageWithDetails[]>;
  getColumnLineageByTableId(tableId: string): Promise<ColumnLineageWithDetails[]>;
  createColumnLineage(lineage: InsertColumnLineage): Promise<ColumnLineage>;

  // Table Lineage Operations  
  getTableLineage(): Promise<TableLineage[]>;
  getTableLineageByTableId(tableId: string): Promise<TableLineage[]>;
  createTableLineage(lineage: InsertTableLineage): Promise<TableLineage>;

  // User Operations (for RBAC)
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserWithRoles(id: string): Promise<UserWithRoles | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;

  // Role Operations
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;

  // User Role Assignment
  assignUserRole(assignment: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: string, roleId: string): Promise<void>;

  // Data Access Policies
  getDataAccessPolicies(resourceType?: string, resourceId?: string): Promise<DataAccessPolicy[]>;
  createDataAccessPolicy(policy: InsertDataAccessPolicy): Promise<DataAccessPolicy>;

  // Data Quality Rules
  getDataQualityRules(resourceType?: string, resourceId?: string): Promise<DataQualityRule[]>;
  createDataQualityRule(rule: InsertDataQualityRule): Promise<DataQualityRule>;

  // Project Operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Additional Column Operations
  getAllColumns(): Promise<Column[]>;
  getUpstreamColumnLineage(columnId: string): Promise<ColumnLineage[]>;
  getDownstreamColumnLineage(columnId: string): Promise<ColumnLineage[]>;
  
  // Data Management
  clearAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // No sample data initialization - will be populated from Snowflake
    console.log('DatabaseStorage initialized - ready for Snowflake data import');
  }

  // Database Operations
  async getDatabases(): Promise<Database[]> {
    return await db.select().from(databases).orderBy(asc(databases.name));
  }

  async getDatabase(id: string): Promise<Database | undefined> {
    const [database] = await db.select().from(databases).where(eq(databases.id, id));
    return database;
  }

  async createDatabase(insertDatabase: InsertDatabase): Promise<Database> {
    const [database] = await db.insert(databases).values(insertDatabase).returning();
    return database;
  }

  // Schema Operations  
  async getSchemas(databaseId?: string): Promise<Schema[]> {
    if (databaseId) {
      return await db.select().from(schemas).where(eq(schemas.databaseId, databaseId)).orderBy(asc(schemas.name));
    }
    return await db.select().from(schemas).orderBy(asc(schemas.name));
  }

  async getSchema(id: string): Promise<Schema | undefined> {
    const [schema] = await db.select().from(schemas).where(eq(schemas.id, id));
    return schema;
  }

  async createSchema(insertSchema: InsertSchema): Promise<Schema> {
    const [schema] = await db.insert(schemas).values(insertSchema).returning();
    return schema;
  }

  // Table Operations
  async getTables(schemaId?: string): Promise<Table[]> {
    if (schemaId) {
      return await db.select().from(tables).where(eq(tables.schemaId, schemaId)).orderBy(asc(tables.name));
    }
    return await db.select().from(tables).orderBy(asc(tables.name));
  }

  async getTablesWithSchema(): Promise<TableWithSchema[]> {
    return await db.select().from(tables)
      .leftJoin(schemas, eq(tables.schemaId, schemas.id))
      .leftJoin(databases, eq(schemas.databaseId, databases.id))
      .orderBy(asc(tables.name));
  }

  async getTable(id: string): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async getTableWithSchema(id: string): Promise<TableWithSchema | undefined> {
    const [result] = await db.select().from(tables)
      .leftJoin(schemas, eq(tables.schemaId, schemas.id))
      .leftJoin(databases, eq(schemas.databaseId, databases.id))
      .where(eq(tables.id, id));
    return result;
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const [table] = await db.insert(tables).values(insertTable).returning();
    return table;
  }

  async updateTable(id: string, updates: Partial<Table>): Promise<Table | undefined> {
    const [table] = await db.update(tables).set(updates).where(eq(tables.id, id)).returning();
    return table;
  }

  // Column Operations
  async getColumnsByTableId(tableId: string): Promise<Column[]> {
    return await db.select().from(columns)
      .where(eq(columns.tableId, tableId))
      .orderBy(asc(columns.ordinalPosition));
  }

  async getColumnsWithTable(tableId: string): Promise<ColumnWithTable[]> {
    return await db.select().from(columns)
      .leftJoin(tables, eq(columns.tableId, tables.id))
      .where(eq(columns.tableId, tableId))
      .orderBy(asc(columns.ordinalPosition));
  }

  async getColumn(id: string): Promise<Column | undefined> {
    const [column] = await db.select().from(columns).where(eq(columns.id, id));
    return column;
  }

  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    const [column] = await db.insert(columns).values(insertColumn).returning();
    return column;
  }

  // Column Lineage Operations
  async getColumnLineage(): Promise<ColumnLineage[]> {
    return await db.select().from(columnLineage).orderBy(desc(columnLineage.createdAt));
  }

  async getColumnLineageWithDetails(): Promise<ColumnLineageWithDetails[]> {
    return await db.select().from(columnLineage)
      .leftJoin(columns, eq(columnLineage.sourceColumnId, columns.id))
      .leftJoin(tables, eq(columns.tableId, tables.id))
      .orderBy(desc(columnLineage.createdAt));
  }

  async getColumnLineageByTableId(tableId: string): Promise<ColumnLineageWithDetails[]> {
    return await db.select().from(columnLineage)
      .leftJoin(columns, eq(columnLineage.sourceColumnId, columns.id))
      .leftJoin(tables, eq(columns.tableId, tables.id))
      .where(eq(tables.id, tableId))
      .orderBy(desc(columnLineage.createdAt));
  }

  async createColumnLineage(insertLineage: InsertColumnLineage): Promise<ColumnLineage> {
    const [lineage] = await db.insert(columnLineage).values(insertLineage).returning();
    return lineage;
  }

  // Table Lineage Operations
  async getTableLineage(): Promise<TableLineage[]> {
    return await db.select().from(tableLineage).orderBy(desc(tableLineage.createdAt));
  }

  async getTableLineageByTableId(tableId: string): Promise<TableLineage[]> {
    return await db.select().from(tableLineage)
      .where(eq(tableLineage.sourceTableId, tableId))
      .orderBy(desc(tableLineage.createdAt));
  }

  async createTableLineage(insertLineage: InsertTableLineage): Promise<TableLineage> {
    const [lineage] = await db.insert(tableLineage).values(insertLineage).returning();
    return lineage;
  }

  // User Operations (for RBAC)
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const [result] = await db.select().from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, id));
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Role Operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(asc(roles.name));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  // User Role Assignment
  async assignUserRole(assignment: InsertUserRole): Promise<UserRole> {
    const [userRole] = await db.insert(userRoles).values(assignment).returning();
    return userRole;
  }

  async removeUserRole(userId: string, roleId: string): Promise<void> {
    await db.delete(userRoles)
      .where(eq(userRoles.userId, userId))
      .where(eq(userRoles.roleId, roleId));
  }

  // Data Access Policies
  async getDataAccessPolicies(resourceType?: string, resourceId?: string): Promise<DataAccessPolicy[]> {
    let query = db.select().from(dataAccessPolicies);
    
    if (resourceType) {
      query = query.where(eq(dataAccessPolicies.resourceType, resourceType));
    }
    
    if (resourceId) {
      query = query.where(eq(dataAccessPolicies.resourceId, resourceId));
    }
    
    return await query.orderBy(desc(dataAccessPolicies.createdAt));
  }

  async createDataAccessPolicy(insertPolicy: InsertDataAccessPolicy): Promise<DataAccessPolicy> {
    const [policy] = await db.insert(dataAccessPolicies).values(insertPolicy).returning();
    return policy;
  }

  // Data Quality Rules
  async getDataQualityRules(resourceType?: string, resourceId?: string): Promise<DataQualityRule[]> {
    let query = db.select().from(dataQualityRules);
    
    if (resourceType) {
      query = query.where(eq(dataQualityRules.resourceType, resourceType));
    }
    
    if (resourceId) {
      query = query.where(eq(dataQualityRules.resourceId, resourceId));
    }
    
    return await query.orderBy(desc(dataQualityRules.createdAt));
  }

  async createDataQualityRule(insertRule: InsertDataQualityRule): Promise<DataQualityRule> {
    const [rule] = await db.insert(dataQualityRules).values(insertRule).returning();
    return rule;
  }

  // Project Operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  // Additional Column Operations
  async getAllColumns(): Promise<Column[]> {
    return await db.select().from(columns).orderBy(columns.name);
  }

  async getUpstreamColumnLineage(columnId: string): Promise<ColumnLineage[]> {
    return await db.select().from(columnLineage)
      .where(eq(columnLineage.targetColumnId, columnId))
      .orderBy(desc(columnLineage.createdAt));
  }

  async getDownstreamColumnLineage(columnId: string): Promise<ColumnLineage[]> {
    return await db.select().from(columnLineage)
      .where(eq(columnLineage.sourceColumnId, columnId))
      .orderBy(desc(columnLineage.createdAt));
  }

  // Clear all data for fresh Snowflake import
  async clearAllData(): Promise<void> {
    // Delete in proper order to avoid foreign key constraints
    await db.delete(columnLineage);
    await db.delete(tableLineage);
    await db.delete(columns);
    await db.delete(tables);
    await db.delete(schemas);
    await db.delete(databases);
    await db.delete(projects);
    await db.delete(dataQualityRules);
    await db.delete(dataAccessPolicies);
    console.log('All data cleared for fresh import');
  }
}

export const storage = new DatabaseStorage();