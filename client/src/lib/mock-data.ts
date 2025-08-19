import { type Table, type Column, type LineageConnection } from "@shared/schema";

export const mockTables: Table[] = [
  {
    id: "customers-table-id",
    name: "customers",
    schema: "staging",
    database: "analytics",
    description: "Customer dimension table",
    tableType: "source",
    position: { x: 50, y: 50 }
  },
  {
    id: "customer-orders-table-id", 
    name: "customer_orders",
    schema: "staging",
    database: "analytics",
    description: "Customer orders intermediate table",
    tableType: "intermediate",
    position: { x: 350, y: 50 }
  },
  {
    id: "customer-summary-table-id",
    name: "customer_summary", 
    schema: "analytics",
    database: "analytics",
    description: "Customer summary analytics table",
    tableType: "analytics",
    position: { x: 650, y: 50 }
  },
  {
    id: "orders-table-id",
    name: "orders",
    schema: "staging", 
    database: "analytics",
    description: "Orders source table",
    tableType: "source",
    position: { x: 50, y: 350 }
  },
  {
    id: "order-analytics-table-id",
    name: "order_analytics",
    schema: "analytics",
    database: "analytics", 
    description: "Order analytics summary",
    tableType: "analytics",
    position: { x: 650, y: 350 }
  }
];

export const mockColumns: Record<string, Column[]> = {
  "customers-table-id": [
    { id: "1", name: "customer_id", dataType: "varchar", isPrimaryKey: true, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 1, description: null },
    { id: "2", name: "customer_name", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 2, description: null },
    { id: "3", name: "customer_email", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 3, description: null },
    { id: "4", name: "customer_segment", dataType: "varchar", isPrimaryKey: false, isNullable: true, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 4, description: null },
    { id: "5", name: "signup_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customers-table-id", ordinalPosition: 5, description: null },
  ],
  "customer-orders-table-id": [
    { id: "6", name: "customer_id", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: true, tableId: "customer-orders-table-id", ordinalPosition: 1, description: null },
    { id: "7", name: "order_id", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: true, tableId: "customer-orders-table-id", ordinalPosition: 2, description: null },
    { id: "8", name: "order_date", dataType: "date", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 3, description: null },
    { id: "9", name: "order_total", dataType: "decimal", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 4, description: null },
    { id: "10", name: "customer_name", dataType: "varchar", isPrimaryKey: false, isNullable: false, isForeignKey: false, tableId: "customer-orders-table-id", ordinalPosition: 5, description: null },
  ]
};

export const mockConnections: LineageConnection[] = [
  {
    id: "conn-1",
    sourceTableId: "customers-table-id",
    sourceColumnId: null,
    targetTableId: "customer-orders-table-id", 
    targetColumnId: null,
    transformationType: "join"
  },
  {
    id: "conn-2",
    sourceTableId: "customer-orders-table-id",
    sourceColumnId: null,
    targetTableId: "customer-summary-table-id",
    targetColumnId: null, 
    transformationType: "aggregation"
  },
  {
    id: "conn-3",
    sourceTableId: "orders-table-id",
    sourceColumnId: null,
    targetTableId: "customer-orders-table-id",
    targetColumnId: null,
    transformationType: "join"
  },
  {
    id: "conn-4", 
    sourceTableId: "customer-orders-table-id",
    sourceColumnId: null,
    targetTableId: "order-analytics-table-id",
    targetColumnId: null,
    transformationType: "aggregation"
  }
];
