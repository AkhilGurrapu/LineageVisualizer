import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Tables routes
  app.get("/api/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const table = await storage.getTable(req.params.id);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table" });
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
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // Columns routes
  app.get("/api/tables/:tableId/columns", async (req, res) => {
    try {
      const columns = await storage.getColumnsByTableId(req.params.tableId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch columns" });
    }
  });

  // Lineage connections routes
  app.get("/api/lineage-connections", async (req, res) => {
    try {
      const connections = await storage.getLineageConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lineage connections" });
    }
  });

  app.get("/api/tables/:tableId/connections", async (req, res) => {
    try {
      const connections = await storage.getConnectionsByTableId(req.params.tableId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table connections" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
