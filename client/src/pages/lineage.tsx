import { useQuery } from "@tanstack/react-query";
import { type Table, type Column, type LineageConnection, type Project } from "@shared/schema";
import Sidebar from "@/components/lineage/sidebar";
import TopBar from "@/components/lineage/topbar";
import LineageCanvas from "@/components/lineage/lineage-canvas";

export default function LineagePage() {
  const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<LineageConnection[]>({
    queryKey: ['/api/lineage-connections'],
  });

  const isLoading = tablesLoading || projectsLoading || connectionsLoading;

  const currentProject = projects[0]; // Use first project as current

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" data-testid="lineage-page">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <div className="flex-1 bg-slate-50 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full" data-testid="loading-state">
              <div className="text-slate-500">Loading data lineage...</div>
            </div>
          ) : (
            <LineageCanvas 
              tables={tables} 
              connections={connections}
              project={currentProject}
            />
          )}
        </div>
      </div>
    </div>
  );
}
