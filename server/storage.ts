import { 
  databases, schemas, tables, columns, columnLineage, tableLineage, 
  roles, users, userRoles, dataAccessPolicies, dataQualityRules, projects,
  type Database, type Schema, type Table, type Column, type ColumnLineage, type TableLineage,
  type Role, type User, type UserRole, type DataAccessPolicy, type DataQualityRule, type Project,
  type InsertDatabase, type InsertSchema, type InsertTable, type InsertColumn, type InsertColumnLineage, 
  type InsertTableLineage, type InsertRole, type InsertUser, type InsertUserRole, 
  type InsertDataAccessPolicy, type InsertDataQualityRule, type InsertProject,
  type TableWithSchema, type ColumnWithTable, type ColumnLineageWithDetails, type UserWithRoles
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    // Initialize with sample data when instantiated
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Check if data already exists
    const existingDatabases = await db.select().from(databases).limit(1);
    if (existingDatabases.length > 0) {
      return; // Data already exists
    }

    try {
      // Create sample database
      const [analyticsDb] = await db.insert(databases).values({
        name: "analytics_warehouse",
        type: "snowflake",
        description: "Main analytics data warehouse",
        environment: "prod"
      }).returning();

      // Create sample roles
      const [dataAnalystRole] = await db.insert(roles).values({
        name: "data_analyst",
        description: "Can read analytics data",
        permissions: ["read_data", "view_lineage"]
      }).returning();

      const [dataEngineerRole] = await db.insert(roles).values({
        name: "data_engineer", 
        description: "Can read and modify data pipelines",
        permissions: ["read_data", "write_data", "view_lineage", "manage_lineage"]
      }).returning();

      // Create sample user
      const [sampleUser] = await db.insert(users).values({
        email: "admin@company.com",
        firstName: "Data",
        lastName: "Admin"
      }).returning();

      // Create sample schemas
      const [stagingSchema] = await db.insert(schemas).values({
        name: "staging",
        databaseId: analyticsDb.id,
        description: "Staging area for raw data",
        schemaType: "staging"
      }).returning();

      const [analyticsSchema] = await db.insert(schemas).values({
        name: "analytics", 
        databaseId: analyticsDb.id,
        description: "Analytics and reporting tables",
        schemaType: "analytics"
      }).returning();

      // Create sample tables
      const [customersTable] = await db.insert(tables).values({
        name: "customers",
        schemaId: stagingSchema.id,
        description: "Customer dimension table",
        tableType: "table",
        dataClassification: "internal",
        rowCount: 10000,
        position: { x: 50, y: 50 },
        tags: ["customer", "dimension"]
      }).returning();

      const [ordersTable] = await db.insert(tables).values({
        name: "orders",
        schemaId: stagingSchema.id,
        description: "Orders source table",
        tableType: "table", 
        dataClassification: "internal",
        rowCount: 50000,
        position: { x: 50, y: 350 },
        tags: ["order", "transaction"]
      }).returning();

      const [customerOrdersTable] = await db.insert(tables).values({
        name: "customer_orders",
        schemaId: stagingSchema.id,
        description: "Customer orders intermediate table", 
        tableType: "view",
        dataClassification: "internal",
        position: { x: 350, y: 50 },
        tags: ["customer", "order", "intermediate"]
      }).returning();

      const [customerSummaryTable] = await db.insert(tables).values({
        name: "customer_summary",
        schemaId: analyticsSchema.id,
        description: "Customer summary analytics table",
        tableType: "materialized_view",
        dataClassification: "internal", 
        rowCount: 8000,
        position: { x: 650, y: 50 },
        tags: ["customer", "analytics", "summary"]
      }).returning();

      const [orderAnalyticsTable] = await db.insert(tables).values({
        name: "order_analytics",
        schemaId: analyticsSchema.id,
        description: "Order analytics summary",
        tableType: "materialized_view",
        dataClassification: "internal",
        rowCount: 365,
        position: { x: 650, y: 350 },
        tags: ["order", "analytics", "daily"]
      }).returning();

      // Create sample columns for customers table
      const customerColumns = [
        { name: "customer_id", dataType: "varchar(50)", isPrimaryKey: true, ordinalPosition: 1, isPii: false },
        { name: "customer_name", dataType: "varchar(255)", isPrimaryKey: false, ordinalPosition: 2, isPii: true },
        { name: "customer_email", dataType: "varchar(255)", isPrimaryKey: false, ordinalPosition: 3, isPii: true },
        { name: "customer_segment", dataType: "varchar(50)", isPrimaryKey: false, ordinalPosition: 4, isPii: false },
        { name: "signup_date", dataType: "date", isPrimaryKey: false, ordinalPosition: 5, isPii: false }
      ];

      const insertedCustomerColumns = await db.insert(columns).values(
        customerColumns.map(col => ({
          ...col,
          tableId: customersTable.id,
          isNullable: !col.isPrimaryKey,
          isForeignKey: false,
          dataClassification: col.isPii ? "confidential" : "internal",
          tags: col.isPii ? ["pii"] : []
        }))
      ).returning();

      // Create sample columns for orders table
      const orderColumns = [
        { name: "order_id", dataType: "varchar(50)", isPrimaryKey: true, ordinalPosition: 1, isPii: false },
        { name: "customer_id", dataType: "varchar(50)", isPrimaryKey: false, ordinalPosition: 2, isPii: false, isForeignKey: true },
        { name: "order_date", dataType: "date", isPrimaryKey: false, ordinalPosition: 3, isPii: false },
        { name: "order_status", dataType: "varchar(50)", isPrimaryKey: false, ordinalPosition: 4, isPii: false },
        { name: "order_total", dataType: "decimal(10,2)", isPrimaryKey: false, ordinalPosition: 5, isPii: false }
      ];

      const insertedOrderColumns = await db.insert(columns).values(
        orderColumns.map(col => ({
          ...col,
          tableId: ordersTable.id,
          isNullable: !col.isPrimaryKey,
          isForeignKey: col.isForeignKey || false,
          dataClassification: "internal",
          tags: []
        }))
      ).returning();

      // Create sample columns for customer_orders intermediate table
      const customerOrderColumns = [
        { name: "customer_id", dataType: "varchar(50)", isPrimaryKey: false, ordinalPosition: 1, isForeignKey: true },
        { name: "order_id", dataType: "varchar(50)", isPrimaryKey: false, ordinalPosition: 2, isForeignKey: true },
        { name: "order_date", dataType: "date", isPrimaryKey: false, ordinalPosition: 3 },
        { name: "order_total", dataType: "decimal(10,2)", isPrimaryKey: false, ordinalPosition: 4 },
        { name: "customer_name", dataType: "varchar(255)", isPrimaryKey: false, ordinalPosition: 5, isPii: true }
      ];

      const insertedCustomerOrderColumns = await db.insert(columns).values(
        customerOrderColumns.map(col => ({
          ...col,
          tableId: customerOrdersTable.id,
          isNullable: false,
          isForeignKey: col.isForeignKey || false,
          isPrimaryKey: false,
          dataClassification: col.isPii ? "confidential" : "internal",
          isPii: col.isPii || false,
          tags: col.isPii ? ["pii"] : []
        }))
      ).returning();

      // Create sample columns for customer_summary analytics table
      const customerSummaryColumns = [
        { name: "customer_id", dataType: "varchar(50)", isPrimaryKey: true, ordinalPosition: 1 },
        { name: "customer_name", dataType: "varchar(255)", isPrimaryKey: false, ordinalPosition: 2, isPii: true },
        { name: "total_orders", dataType: "integer", isPrimaryKey: false, ordinalPosition: 3 },
        { name: "total_spent", dataType: "decimal(12,2)", isPrimaryKey: false, ordinalPosition: 4 },
        { name: "avg_order_value", dataType: "decimal(10,2)", isPrimaryKey: false, ordinalPosition: 5 }
      ];

      const insertedCustomerSummaryColumns = await db.insert(columns).values(
        customerSummaryColumns.map(col => ({
          ...col,
          tableId: customerSummaryTable.id,
          isNullable: !col.isPrimaryKey,
          isForeignKey: false,
          dataClassification: col.isPii ? "confidential" : "internal",
          isPii: col.isPii || false,
          tags: col.isPii ? ["pii"] : []
        }))
      ).returning();

      // Create sample columns for order_analytics table
      const orderAnalyticsColumns = [
        { name: "order_date", dataType: "date", isPrimaryKey: false, ordinalPosition: 1 },
        { name: "daily_orders", dataType: "integer", isPrimaryKey: false, ordinalPosition: 2 },
        { name: "daily_revenue", dataType: "decimal(12,2)", isPrimaryKey: false, ordinalPosition: 3 },
        { name: "avg_order_value", dataType: "decimal(10,2)", isPrimaryKey: false, ordinalPosition: 4 },
        { name: "new_customers", dataType: "integer", isPrimaryKey: false, ordinalPosition: 5 }
      ];

      await db.insert(columns).values(
        orderAnalyticsColumns.map(col => ({
          ...col,
          tableId: orderAnalyticsTable.id,
          isNullable: false,
          isForeignKey: false,
          isPrimaryKey: false,
          dataClassification: "internal",
          isPii: false,
          tags: []
        }))
      );

      // Create table-level lineage
      await db.insert(tableLineage).values([
        {
          sourceTableId: customersTable.id,
          targetTableId: customerOrdersTable.id,
          transformationType: "join",
          transformationLogic: "JOIN customers ON customers.customer_id = orders.customer_id",
          executionFrequency: "hourly"
        },
        {
          sourceTableId: ordersTable.id,
          targetTableId: customerOrdersTable.id,
          transformationType: "join",
          transformationLogic: "JOIN orders ON customers.customer_id = orders.customer_id",
          executionFrequency: "hourly"
        },
        {
          sourceTableId: customerOrdersTable.id,
          targetTableId: customerSummaryTable.id,
          transformationType: "aggregation",
          transformationLogic: "GROUP BY customer_id, customer_name",
          executionFrequency: "daily"
        },
        {
          sourceTableId: customerOrdersTable.id,
          targetTableId: orderAnalyticsTable.id,
          transformationType: "aggregation",
          transformationLogic: "GROUP BY DATE(order_date)",
          executionFrequency: "daily"
        }
      ]);

      // Create column-level lineage examples
      // Customer ID lineage from customers to customer_orders
      const customerIdSource = insertedCustomerColumns.find(c => c.name === "customer_id");
      const customerIdTarget = insertedCustomerOrderColumns.find(c => c.name === "customer_id");
      
      if (customerIdSource && customerIdTarget) {
        await db.insert(columnLineage).values({
          sourceColumnId: customerIdSource.id,
          targetColumnId: customerIdTarget.id,
          transformationType: "direct",
          transformationLogic: "Direct copy",
          confidence: 100
        });
      }

      // Customer name lineage
      const customerNameSource = insertedCustomerColumns.find(c => c.name === "customer_name");
      const customerNameTarget = insertedCustomerOrderColumns.find(c => c.name === "customer_name");
      
      if (customerNameSource && customerNameTarget) {
        await db.insert(columnLineage).values({
          sourceColumnId: customerNameSource.id,
          targetColumnId: customerNameTarget.id,
          transformationType: "direct",
          transformationLogic: "Direct copy from customers table",
          confidence: 100
        });
      }

      // Order columns lineage
      const orderIdSource = insertedOrderColumns.find(c => c.name === "order_id");
      const orderIdTarget = insertedCustomerOrderColumns.find(c => c.name === "order_id");
      
      if (orderIdSource && orderIdTarget) {
        await db.insert(columnLineage).values({
          sourceColumnId: orderIdSource.id,
          targetColumnId: orderIdTarget.id,
          transformationType: "direct",
          transformationLogic: "Direct copy from orders table",
          confidence: 100
        });
      }

      // Create sample project
      await db.insert(projects).values({
        name: "dbt_shop_online",
        description: "E-commerce data pipeline with Snowflake integration",
        ownerId: sampleUser.id,
        modelCount: 22,
        sourceCount: 8,
        tags: ["ecommerce", "snowflake", "dbt"]
      });

      // Create sample data quality rules
      await db.insert(dataQualityRules).values([
        {
          name: "Customer ID Not Null",
          description: "Customer ID should never be null",
          ruleType: "null_check",
          resourceType: "column",
          resourceId: customerIdSource?.id || "",
          ruleDefinition: { "check": "not_null" },
          severity: "critical"
        },
        {
          name: "Order Total Range Check",
          description: "Order total should be between 0 and 10000",
          ruleType: "range_check", 
          resourceType: "column",
          resourceId: insertedOrderColumns.find(c => c.name === "order_total")?.id || "",
          ruleDefinition: { "min": 0, "max": 10000 },
          severity: "high"
        }
      ]);

      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
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
      .innerJoin(schemas, eq(tables.schemaId, schemas.id))
      .innerJoin(databases, eq(schemas.databaseId, databases.id))
      .orderBy(asc(tables.name));
  }

  async getTable(id: string): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async getTableWithSchema(id: string): Promise<TableWithSchema | undefined> {
    const result = await db.select().from(tables)
      .innerJoin(schemas, eq(tables.schemaId, schemas.id))
      .innerJoin(databases, eq(schemas.databaseId, databases.id))
      .where(eq(tables.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.tables,
      schema: {
        ...row.schemas,
        database: row.databases
      }
    };
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const [table] = await db.insert(tables).values(insertTable).returning();
    return table;
  }

  async updateTable(id: string, updates: Partial<Table>): Promise<Table | undefined> {
    const [table] = await db.update(tables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tables.id, id))
      .returning();
    return table;
  }

  // Column Operations
  async getColumnsByTableId(tableId: string): Promise<Column[]> {
    return await db.select().from(columns)
      .where(eq(columns.tableId, tableId))
      .orderBy(asc(columns.ordinalPosition));
  }

  async getColumnsWithTable(tableId: string): Promise<ColumnWithTable[]> {
    const result = await db.select().from(columns)
      .innerJoin(tables, eq(columns.tableId, tables.id))
      .innerJoin(schemas, eq(tables.schemaId, schemas.id))
      .innerJoin(databases, eq(schemas.databaseId, databases.id))
      .where(eq(columns.tableId, tableId))
      .orderBy(asc(columns.ordinalPosition));

    return result.map(row => ({
      ...row.columns,
      table: {
        ...row.tables,
        schema: {
          ...row.schemas,
          database: row.databases
        }
      }
    }));
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
    const result = await db.select().from(columnLineage)
      .innerJoin(columns, eq(columnLineage.sourceColumnId, columns.id))
      .innerJoin(tables, eq(columns.tableId, tables.id))
      .innerJoin(schemas, eq(tables.schemaId, schemas.id))
      .innerJoin(databases, eq(schemas.databaseId, databases.id))
      .orderBy(desc(columnLineage.createdAt));

    // This is a simplified version - in reality we'd need separate joins for source and target
    return result.map(row => ({
      ...row.column_lineage,
      sourceColumn: {
        ...row.columns,
        table: {
          ...row.tables,
          schema: {
            ...row.schemas,
            database: row.databases
          }
        }
      },
      // Note: This would need a separate query for target column details
      targetColumn: {} as ColumnWithTable
    }));
  }

  async getColumnLineageByTableId(tableId: string): Promise<ColumnLineageWithDetails[]> {
    // Get columns for the table first
    const tableColumns = await this.getColumnsByTableId(tableId);
    const columnIds = tableColumns.map(c => c.id);
    
    if (columnIds.length === 0) return [];

    return await db.select().from(columnLineage)
      .where(
        and(
          inArray(columnLineage.sourceColumnId, columnIds),
          inArray(columnLineage.targetColumnId, columnIds)
        )
      )
      .orderBy(desc(columnLineage.createdAt)) as ColumnLineageWithDetails[];
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
      .where(
        and(
          eq(tableLineage.sourceTableId, tableId),
          eq(tableLineage.targetTableId, tableId)
        )
      )
      .orderBy(desc(tableLineage.createdAt));
  }

  async createTableLineage(insertLineage: InsertTableLineage): Promise<TableLineage> {
    const [lineage] = await db.insert(tableLineage).values(insertLineage).returning();
    return lineage;
  }

  // User Operations (for RBAC)
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true)).orderBy(asc(users.email));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserWithRoles(id: string): Promise<UserWithRoles | undefined> {
    const result = await db.select().from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.id, id));

    if (result.length === 0) return undefined;

    const user = result[0].users;
    const userRoleData = result
      .filter(row => row.user_roles && row.roles)
      .map(row => ({
        ...row.user_roles!,
        role: row.roles!
      }));

    return {
      ...user,
      userRoles: userRoleData
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(insertUser)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...insertUser,
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
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        )
      );
  }

  // Data Access Policies
  async getDataAccessPolicies(resourceType?: string, resourceId?: string): Promise<DataAccessPolicy[]> {
    let query = db.select().from(dataAccessPolicies).where(eq(dataAccessPolicies.isActive, true));
    
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
    let query = db.select().from(dataQualityRules).where(eq(dataQualityRules.isActive, true));
    
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
