import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDatabaseSchema, insertSchemaSchema, insertTableSchema, insertColumnSchema,
  insertColumnLineageSchema, insertTableLineageSchema, insertRoleSchema, insertUserSchema,
  insertUserRoleSchema, insertDataAccessPolicySchema, insertDataQualityRuleSchema, insertProjectSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Database routes
  app.get("/api/databases", async (req, res) => {
    try {
      const databases = await storage.getDatabases();
      res.json(databases);
    } catch (error) {
      console.error("Error fetching databases:", error);
      res.status(500).json({ message: "Failed to fetch databases" });
    }
  });

  app.get("/api/databases/:id", async (req, res) => {
    try {
      const database = await storage.getDatabase(req.params.id);
      if (!database) {
        return res.status(404).json({ message: "Database not found" });
      }
      res.json(database);
    } catch (error) {
      console.error("Error fetching database:", error);
      res.status(500).json({ message: "Failed to fetch database" });
    }
  });

  app.post("/api/databases", async (req, res) => {
    try {
      const validatedData = insertDatabaseSchema.parse(req.body);
      const database = await storage.createDatabase(validatedData);
      res.status(201).json(database);
    } catch (error) {
      console.error("Error creating database:", error);
      res.status(400).json({ message: "Failed to create database" });
    }
  });

  // Schema routes
  app.get("/api/schemas", async (req, res) => {
    try {
      const databaseId = req.query.databaseId as string;
      const schemas = await storage.getSchemas(databaseId);
      res.json(schemas);
    } catch (error) {
      console.error("Error fetching schemas:", error);
      res.status(500).json({ message: "Failed to fetch schemas" });
    }
  });

  app.get("/api/schemas/:id", async (req, res) => {
    try {
      const schema = await storage.getSchema(req.params.id);
      if (!schema) {
        return res.status(404).json({ message: "Schema not found" });
      }
      res.json(schema);
    } catch (error) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ message: "Failed to fetch schema" });
    }
  });

  app.post("/api/schemas", async (req, res) => {
    try {
      const validatedData = insertSchemaSchema.parse(req.body);
      const schema = await storage.createSchema(validatedData);
      res.status(201).json(schema);
    } catch (error) {
      console.error("Error creating schema:", error);
      res.status(400).json({ message: "Failed to create schema" });
    }
  });

  // Table routes
  app.get("/api/tables", async (req, res) => {
    try {
      const schemaId = req.query.schemaId as string;
      const withSchema = req.query.withSchema === 'true';
      
      if (withSchema) {
        const tables = await storage.getTablesWithSchema();
        res.json(tables);
      } else {
        const tables = await storage.getTables(schemaId);
        res.json(tables);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const withSchema = req.query.withSchema === 'true';
      
      if (withSchema) {
        const table = await storage.getTableWithSchema(req.params.id);
        if (!table) {
          return res.status(404).json({ message: "Table not found" });
        }
        res.json(table);
      } else {
        const table = await storage.getTable(req.params.id);
        if (!table) {
          return res.status(404).json({ message: "Table not found" });
        }
        res.json(table);
      }
    } catch (error) {
      console.error("Error fetching table:", error);
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });

  app.post("/api/tables", async (req, res) => {
    try {
      const validatedData = insertTableSchema.parse(req.body);
      const table = await storage.createTable(validatedData);
      res.status(201).json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(400).json({ message: "Failed to create table" });
    }
  });

  app.patch("/api/tables/:id", async (req, res) => {
    try {
      const updatedTable = await storage.updateTable(req.params.id, req.body);
      if (!updatedTable) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(updatedTable);
    } catch (error) {
      console.error("Error updating table:", error);
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // Column routes
  app.get("/api/tables/:tableId/columns", async (req, res) => {
    try {
      const withTable = req.query.withTable === 'true';
      
      if (withTable) {
        const columns = await storage.getColumnsWithTable(req.params.tableId);
        res.json(columns);
      } else {
        const columns = await storage.getColumnsByTableId(req.params.tableId);
        res.json(columns);
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
      res.status(500).json({ message: "Failed to fetch columns" });
    }
  });

  app.get("/api/columns/:id", async (req, res) => {
    try {
      const column = await storage.getColumn(req.params.id);
      if (!column) {
        return res.status(404).json({ message: "Column not found" });
      }
      res.json(column);
    } catch (error) {
      console.error("Error fetching column:", error);
      res.status(500).json({ message: "Failed to fetch column" });
    }
  });

  app.post("/api/columns", async (req, res) => {
    try {
      const validatedData = insertColumnSchema.parse(req.body);
      const column = await storage.createColumn(validatedData);
      res.status(201).json(column);
    } catch (error) {
      console.error("Error creating column:", error);
      res.status(400).json({ message: "Failed to create column" });
    }
  });

  // Column Lineage routes
  app.get("/api/column-lineage", async (req, res) => {
    try {
      const withDetails = req.query.withDetails === 'true';
      const tableId = req.query.tableId as string;
      
      if (tableId) {
        const lineage = await storage.getColumnLineageByTableId(tableId);
        res.json(lineage);
      } else if (withDetails) {
        const lineage = await storage.getColumnLineageWithDetails();
        res.json(lineage);
      } else {
        const lineage = await storage.getColumnLineage();
        res.json(lineage);
      }
    } catch (error) {
      console.error("Error fetching column lineage:", error);
      res.status(500).json({ message: "Failed to fetch column lineage" });
    }
  });

  app.post("/api/column-lineage", async (req, res) => {
    try {
      const validatedData = insertColumnLineageSchema.parse(req.body);
      const lineage = await storage.createColumnLineage(validatedData);
      res.status(201).json(lineage);
    } catch (error) {
      console.error("Error creating column lineage:", error);
      res.status(400).json({ message: "Failed to create column lineage" });
    }
  });

  // Additional column lineage routes for upstream/downstream
  app.get("/api/columns", async (req, res) => {
    try {
      const columns = await storage.getAllColumns();
      res.json(columns);
    } catch (error) {
      console.error("Error fetching all columns:", error);
      res.status(500).json({ message: "Failed to fetch columns" });
    }
  });

  app.get("/api/column-lineage/upstream/:columnId", async (req, res) => {
    try {
      const { columnId } = req.params;
      const upstreamLineage = await storage.getUpstreamColumnLineage(columnId);
      res.json(upstreamLineage);
    } catch (error) {
      console.error("Error fetching upstream column lineage:", error);
      res.status(500).json({ message: "Failed to fetch upstream column lineage" });
    }
  });

  app.get("/api/column-lineage/downstream/:columnId", async (req, res) => {
    try {
      const { columnId } = req.params;
      const downstreamLineage = await storage.getDownstreamColumnLineage(columnId);
      res.json(downstreamLineage);
    } catch (error) {
      console.error("Error fetching downstream column lineage:", error);
      res.status(500).json({ message: "Failed to fetch downstream column lineage" });
    }
  });

  // Table Lineage routes
  app.get("/api/table-lineage", async (req, res) => {
    try {
      const tableId = req.query.tableId as string;
      
      if (tableId) {
        const lineage = await storage.getTableLineageByTableId(tableId);
        res.json(lineage);
      } else {
        const lineage = await storage.getTableLineage();
        res.json(lineage);
      }
    } catch (error) {
      console.error("Error fetching table lineage:", error);
      res.status(500).json({ message: "Failed to fetch table lineage" });
    }
  });

  app.post("/api/table-lineage", async (req, res) => {
    try {
      const validatedData = insertTableLineageSchema.parse(req.body);
      const lineage = await storage.createTableLineage(validatedData);
      res.status(201).json(lineage);
    } catch (error) {
      console.error("Error creating table lineage:", error);
      res.status(400).json({ message: "Failed to create table lineage" });
    }
  });

  // Legacy routes for backwards compatibility
  app.get("/api/lineage-connections", async (req, res) => {
    try {
      const tableLineage = await storage.getTableLineage();
      // Convert to legacy format for existing frontend
      const legacyConnections = tableLineage.map(lineage => ({
        id: lineage.id,
        sourceTableId: lineage.sourceTableId,
        sourceColumnId: null,
        targetTableId: lineage.targetTableId,
        targetColumnId: null,
        transformationType: lineage.transformationType
      }));
      res.json(legacyConnections);
    } catch (error) {
      console.error("Error fetching legacy lineage connections:", error);
      res.status(500).json({ message: "Failed to fetch lineage connections" });
    }
  });

  app.get("/api/tables/:tableId/connections", async (req, res) => {
    try {
      const tableLineage = await storage.getTableLineageByTableId(req.params.tableId);
      // Convert to legacy format for existing frontend
      const legacyConnections = tableLineage.map(lineage => ({
        id: lineage.id,
        sourceTableId: lineage.sourceTableId,
        sourceColumnId: null,
        targetTableId: lineage.targetTableId,
        targetColumnId: null,
        transformationType: lineage.transformationType
      }));
      res.json(legacyConnections);
    } catch (error) {
      console.error("Error fetching table connections:", error);
      res.status(500).json({ message: "Failed to fetch table connections" });
    }
  });

  // User and RBAC routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const withRoles = req.query.withRoles === 'true';
      
      if (withRoles) {
        const user = await storage.getUserWithRoles(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } else {
        const user = await storage.getUser(req.params.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Role routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ message: "Failed to create role" });
    }
  });

  // User Role Assignment routes
  app.post("/api/user-roles", async (req, res) => {
    try {
      const validatedData = insertUserRoleSchema.parse(req.body);
      const userRole = await storage.assignUserRole(validatedData);
      res.status(201).json(userRole);
    } catch (error) {
      console.error("Error assigning user role:", error);
      res.status(400).json({ message: "Failed to assign user role" });
    }
  });

  app.delete("/api/user-roles/:userId/:roleId", async (req, res) => {
    try {
      await storage.removeUserRole(req.params.userId, req.params.roleId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user role:", error);
      res.status(500).json({ message: "Failed to remove user role" });
    }
  });

  // Data Access Policy routes
  app.get("/api/data-access-policies", async (req, res) => {
    try {
      const resourceType = req.query.resourceType as string;
      const resourceId = req.query.resourceId as string;
      const policies = await storage.getDataAccessPolicies(resourceType, resourceId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching data access policies:", error);
      res.status(500).json({ message: "Failed to fetch data access policies" });
    }
  });

  app.post("/api/data-access-policies", async (req, res) => {
    try {
      const validatedData = insertDataAccessPolicySchema.parse(req.body);
      const policy = await storage.createDataAccessPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating data access policy:", error);
      res.status(400).json({ message: "Failed to create data access policy" });
    }
  });

  // Data Quality Rules routes
  app.get("/api/data-quality-rules", async (req, res) => {
    try {
      const resourceType = req.query.resourceType as string;
      const resourceId = req.query.resourceId as string;
      const rules = await storage.getDataQualityRules(resourceType, resourceId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching data quality rules:", error);
      res.status(500).json({ message: "Failed to fetch data quality rules" });
    }
  });

  app.post("/api/data-quality-rules", async (req, res) => {
    try {
      const validatedData = insertDataQualityRuleSchema.parse(req.body);
      const rule = await storage.createDataQualityRule(validatedData);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating data quality rule:", error);
      res.status(400).json({ message: "Failed to create data quality rule" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  // Snowflake integration routes
  app.post('/api/snowflake/test-connection', async (req, res) => {
    try {
      const config = req.body;
      const { SnowflakeConnector } = await import('./snowflake');
      const connector = new SnowflakeConnector();
      
      const result = await connector.testConnection(config);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Connection successful',
          tableCount: result.tableCount 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.error 
        });
      }
    } catch (error: any) {
      console.error('Snowflake test connection error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during connection test' 
      });
    }
  });

  app.post('/api/snowflake/load-data', async (req, res) => {
    try {
      const config = req.body;
      const { SnowflakeConnector } = await import('./snowflake');
      const connector = new SnowflakeConnector();
      
      // Clear existing sample data
      await storage.clearAllData();
      
      // Get tables and views from Snowflake
      const [tables, views, columns] = await Promise.all([
        connector.getTables(config),
        connector.getViews(config),
        connector.getColumns(config)
      ]);
      
      // Combine tables and views
      const allTables = [...tables, ...views];
      
      // Create database and schema in our system
      const database = await storage.createDatabase({
        name: config.database,
        type: 'snowflake',
        description: `Snowflake database: ${config.database}`,
        connectionString: `${config.account}/${config.database}`,
        tags: ['snowflake', 'production']
      });
      
      const schema = await storage.createSchema({
        name: config.schema,
        databaseId: database.id,
        description: `Snowflake schema: ${config.schema}`,
        tags: ['snowflake']
      });
      
      // Create tables in our system
      const createdTables = [];
      for (const table of allTables) {
        const createdTable = await storage.createTable({
          name: table.table_name,
          schemaId: schema.id,
          description: table.comment || `Snowflake ${table.table_type.toLowerCase()}: ${table.table_name}`,
          tableType: table.table_type.toLowerCase() === 'view' ? 'view' : 'table',
          dataClassification: 'internal',
          rowCount: table.row_count || 0,
          sizeBytes: table.bytes || 0,
          position: { 
            x: Math.random() * 800 + 100, 
            y: Math.random() * 600 + 100 
          },
          tags: ['snowflake', table.table_type.toLowerCase()]
        });
        createdTables.push(createdTable);
      }
      
      // Create columns in our system
      let columnCount = 0;
      for (const column of columns) {
        const table = createdTables.find(t => t.name === column.table_name);
        if (table) {
          await storage.createColumn({
            name: column.column_name,
            tableId: table.id,
            dataType: column.data_type,
            isNullable: column.is_nullable === 'YES',
            isPrimaryKey: false, // We'd need additional queries to detect primary keys
            isForeignKey: false, // We'd need additional queries to detect foreign keys
            ordinalPosition: column.ordinal_position,
            dataClassification: 'internal',
            isPii: false, // Could be enhanced with PII detection
            tags: ['snowflake']
          });
          columnCount++;
        }
      }
      
      connector.disconnect();
      
      res.json({
        success: true,
        message: 'Data loaded successfully from Snowflake',
        tableCount: allTables.length,
        columnCount: columnCount,
        database: database.name,
        schema: schema.name
      });
      
    } catch (error: any) {
      console.error('Snowflake load data error:', error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to load data from Snowflake: ${error.message}` 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
