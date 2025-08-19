import { type Table, type InsertTable, type Column, type InsertColumn, type LineageConnection, type InsertLineageConnection, type Project, type InsertProject } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: string): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: string, updates: Partial<Table>): Promise<Table | undefined>;

  // Columns
  getColumnsByTableId(tableId: string): Promise<Column[]>;
  getColumn(id: string): Promise<Column | undefined>;
  createColumn(column: InsertColumn): Promise<Column>;

  // Lineage Connections
  getLineageConnections(): Promise<LineageConnection[]>;
  getConnectionsByTableId(tableId: string): Promise<LineageConnection[]>;
  createLineageConnection(connection: InsertLineageConnection): Promise<LineageConnection>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private tables: Map<string, Table>;
  private columns: Map<string, Column>;
  private lineageConnections: Map<string, LineageConnection>;

  constructor() {
    this.projects = new Map();
    this.tables = new Map();
    this.columns = new Map();
    this.lineageConnections = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample project
    const project: Project = {
      id: randomUUID(),
      name: "dbt_shop_online",
      description: "E-commerce data pipeline",
      modelCount: 22,
      sourceCount: 8,
    };
    this.projects.set(project.id, project);

    // Create sample tables
    const customersTable: Table = {
      id: "customers-table-id",
      name: "customers",
      schema: "staging",
      database: "analytics",
      description: "Customer dimension table",
      tableType: "source",
      position: { x: 50, y: 50 }
    };

    const customerOrdersTable: Table = {
      id: "customer-orders-table-id",
      name: "customer_orders",
      schema: "staging",
      database: "analytics",
      description: "Customer orders intermediate table",
      tableType: "intermediate",
      position: { x: 350, y: 50 }
    };

    const customerSummaryTable: Table = {
      id: "customer-summary-table-id",
      name: "customer_summary",
      schema: "analytics",
      database: "analytics",
      description: "Customer summary analytics table",
      tableType: "analytics",
      position: { x: 650, y: 50 }
    };

    const ordersTable: Table = {
      id: "orders-table-id",
      name: "orders",
      schema: "staging",
      database: "analytics",
      description: "Orders source table",
      tableType: "source",
      position: { x: 50, y: 350 }
    };

    const orderAnalyticsTable: Table = {
      id: "order-analytics-table-id",
      name: "order_analytics",
      schema: "analytics",
      database: "analytics",
      description: "Order analytics summary",
      tableType: "analytics",
      position: { x: 650, y: 350 }
    };

    [customersTable, customerOrdersTable, customerSummaryTable, ordersTable, orderAnalyticsTable].forEach(table => {
      this.tables.set(table.id, table);
    });

    // Create sample columns
    const columns: Column[] = [
      // Customers table columns
      { id: randomUUID(), name: "customer_id", dataType: "varchar", isPrimaryKey: true, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 1, description: null },
      { id: randomUUID(), name: "customer_name", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 2, description: null },
      { id: randomUUID(), name: "customer_email", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 3, description: null },
      { id: randomUUID(), name: "customer_segment", dataType: "varchar", isPrimaryKey: false, isNullable: true, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 4, description: null },
      { id: randomUUID(), name: "signup_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 5, description: null },
      
      // Customer Orders table columns
      { id: randomUUID(), name: "customer_id", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: true, tableId: "customer-orders-table-id", ordinalPosition: 1, description: null },
      { id: randomUUID(), name: "order_id", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: true, tableId: "customer-orders-table-id", ordinalPosition: 2, description: null },
      { id: randomUUID(), name: "order_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 3, description: null },
      { id: randomUUID(), name: "order_total", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 4, description: null },
      { id: randomUUID(), name: "customer_name", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 5, description: null },
      
      // Customer Summary table columns
      { id: randomUUID(), name: "customer_id", dataType: "varchar", isPrimaryKey: true, isNullable: false, isForeignKey: false, tableId: "customer-summary-table-id", ordinalPosition: 1, description: null },
      { id: randomUUID(), name: "customer_name", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-summary-table-id", ordinalPosition: 2, description: null },
      { id: randomUUID(), name: "total_orders", dataType: "integer", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-summary-table-id", ordinalPosition: 3, description: null },
      { id: randomUUID(), name: "total_spent", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-summary-table-id", ordinalPosition: 4, description: null },
      { id: randomUUID(), name: "avg_order_value", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-summary-table-id", ordinalPosition: 5, description: null },
      
      // Orders table columns
      { id: randomUUID(), name: "order_id", dataType: "varchar", isPrimaryKey: true, isNullable: false, isForeignKey: false, tableId: "orders-table-id", ordinalPosition: 1, description: null },
      { id: randomUUID(), name: "customer_id", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: true, tableId: "orders-table-id", ordinalPosition: 2, description: null },
      { id: randomUUID(), name: "order_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "orders-table-id", ordinalPosition: 3, description: null },
      { id: randomUUID(), name: "order_status", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "orders-table-id", ordinalPosition: 4, description: null },
      { id: randomUUID(), name: "order_total", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "orders-table-id", ordinalPosition: 5, description: null },
      
      // Order Analytics table columns
      { id: randomUUID(), name: "order_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "order-analytics-table-id", ordinalPosition: 1, description: null },
      { id: randomUUID(), name: "daily_orders", dataType: "integer", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "order-analytics-table-id", ordinalPosition: 2, description: null },
      { id: randomUUID(), name: "daily_revenue", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "order-analytics-table-id", ordinalPosition: 3, description: null },
      { id: randomUUID(), name: "avg_order_value", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "order-analytics-table-id", ordinalPosition: 4, description: null },
      { id: randomUUID(), name: "new_customers", dataType: "integer", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "order-analytics-table-id", ordinalPosition: 5, description: null },
    ];

    columns.forEach(column => {
      this.columns.set(column.id, column);
    });

    // Create sample lineage connections
    const connections: LineageConnection[] = [
      {
        id: randomUUID(),
        sourceTableId: "customers-table-id",
        sourceColumnId: null,
        targetTableId: "customer-orders-table-id",
        targetColumnId: null,
        transformationType: "join"
      },
      {
        id: randomUUID(),
        sourceTableId: "customer-orders-table-id",
        sourceColumnId: null,
        targetTableId: "customer-summary-table-id",
        targetColumnId: null,
        transformationType: "aggregation"
      },
      {
        id: randomUUID(),
        sourceTableId: "orders-table-id",
        sourceColumnId: null,
        targetTableId: "customer-orders-table-id",
        targetColumnId: null,
        transformationType: "join"
      },
      {
        id: randomUUID(),
        sourceTableId: "customer-orders-table-id",
        sourceColumnId: null,
        targetTableId: "order-analytics-table-id",
        targetColumnId: null,
        transformationType: "aggregation"
      }
    ];

    connections.forEach(connection => {
      this.lineageConnections.set(connection.id, connection);
    });
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async getTable(id: string): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = randomUUID();
    const table: Table = { ...insertTable, id };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: string, updates: Partial<Table>): Promise<Table | undefined> {
    const table = this.tables.get(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...updates };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  // Columns
  async getColumnsByTableId(tableId: string): Promise<Column[]> {
    return Array.from(this.columns.values()).filter(column => column.tableId === tableId);
  }

  async getColumn(id: string): Promise<Column | undefined> {
    return this.columns.get(id);
  }

  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    const id = randomUUID();
    const column: Column = { ...insertColumn, id };
    this.columns.set(id, column);
    return column;
  }

  // Lineage Connections
  async getLineageConnections(): Promise<LineageConnection[]> {
    return Array.from(this.lineageConnections.values());
  }

  async getConnectionsByTableId(tableId: string): Promise<LineageConnection[]> {
    return Array.from(this.lineageConnections.values()).filter(
      connection => connection.sourceTableId === tableId || connection.targetTableId === tableId
    );
  }

  async createLineageConnection(insertConnection: InsertLineageConnection): Promise<LineageConnection> {
    const id = randomUUID();
    const connection: LineageConnection = { ...insertConnection, id };
    this.lineageConnections.set(id, connection);
    return connection;
  }
}

export const storage = new MemStorage();
