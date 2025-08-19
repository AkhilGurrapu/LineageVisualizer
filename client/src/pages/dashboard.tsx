import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Table, type Database, type Schema, type TableLineage, type Project } from "@shared/schema";
import LineageCanvas from "@/components/lineage/lineage-canvas";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Maximize2, Minimize2, Database as DatabaseIcon } from "lucide-react";

export default function Dashboard() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  const { data: databases = [] } = useQuery<Database[]>({
    queryKey: ['/api/databases'],
  });

  const { data: schemas = [] } = useQuery<Schema[]>({
    queryKey: ['/api/schemas'],
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: connections = [] } = useQuery<TableLineage[]>({
    queryKey: ['/api/table-lineage'],
  });

  // Filter tables based on selected database/schema
  const filteredTables = tables.filter(table => {
    if (!selectedDatabase && !selectedSchema) return true;
    
    const tableSchema = schemas.find(s => s.id === table.schemaId);
    if (selectedDatabase && tableSchema?.databaseId !== selectedDatabase) return false;
    if (selectedSchema && table.schemaId !== selectedSchema) return false;
    
    return true;
  });

  const currentProject = projects[0];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} bg-slate-50 flex flex-col`} data-testid="dashboard">
      {/* Header with Database Selector */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-slate-900">Data Lineage</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Database</label>
              <Select 
                value={selectedDatabase || ""} 
                onValueChange={(value) => {
                  const dbId = value === "all" ? null : value;
                  setSelectedDatabase(dbId);
                  if (dbId !== selectedDatabase) {
                    setSelectedSchema(null);
                  }
                }}
              >
                <SelectTrigger className="w-48" data-testid="select-database">
                  <SelectValue placeholder="All Databases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Databases</SelectItem>
                  {databases.map((database) => (
                    <SelectItem key={database.id} value={database.id}>
                      {database.name} ({database.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Schema</label>
              <Select 
                value={selectedSchema || ""} 
                onValueChange={(value) => {
                  setSelectedSchema(value === "all" ? null : value);
                }}
                disabled={!selectedDatabase}
              >
                <SelectTrigger className="w-40" data-testid="select-schema">
                  <SelectValue placeholder="All Schemas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schemas</SelectItem>
                  {schemas.filter(schema => 
                    !selectedDatabase || schema.databaseId === selectedDatabase
                  ).map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            data-testid={isFullscreen ? "button-minimize" : "button-maximize"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 mr-2" />
                Minimize
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 mr-2" />
                Maximize
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <LineageCanvas 
          tables={filteredTables} 
          connections={connections}
          project={currentProject}
        />
      </div>
    </div>
  );
}