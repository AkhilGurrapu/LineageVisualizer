import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Column, type ColumnLineage, type ColumnWithTable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowUp, ArrowDown, GitBranch, Table, Database, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ColumnLineagePanelProps {
  columnId: string;
  tableId: string | null;
  position?: { x: number; y: number };
  onClose: () => void;
}

export default function ColumnLineagePanel({ columnId, tableId, position, onClose }: ColumnLineagePanelProps) {
  const [upstreamLineage, setUpstreamLineage] = useState<any[]>([]);
  const [downstreamLineage, setDownstreamLineage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: column } = useQuery<Column>({
    queryKey: ['/api/columns', columnId],
  });

  useEffect(() => {
    const fetchLineage = async () => {
      try {
        setLoading(true);
        
        // Fetch upstream and downstream lineage
        const [upstreamResponse, downstreamResponse] = await Promise.all([
          apiRequest('GET', `/api/column-lineage/upstream/${columnId}`),
          apiRequest('GET', `/api/column-lineage/downstream/${columnId}`)
        ]);
        
        const upstreamData = await upstreamResponse.json();
        const downstreamData = await downstreamResponse.json();
        
        setUpstreamLineage(upstreamData);
        setDownstreamLineage(downstreamData);
      } catch (error) {
        console.error('Failed to fetch column lineage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLineage();
  }, [columnId]);

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl border w-[500px] max-h-[600px] overflow-y-auto"
      style={{
        top: position ? Math.min(position.y, window.innerHeight - 620) : '50%',
        left: position ? Math.min(position.x + 20, window.innerWidth - 520) : '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Column Lineage</h3>
              <p className="text-sm text-slate-600">{column?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-4">
            Loading lineage data...
          </div>
        ) : (
          <>
            {/* Upstream Lineage */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUp className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-sm">Upstream Sources ({upstreamLineage.length})</h4>
              </div>
              
              {upstreamLineage.length === 0 ? (
                <p className="text-xs text-slate-500 ml-6">No upstream dependencies</p>
              ) : (
                <div className="space-y-3 ml-6">
                  {upstreamLineage.map((lineage) => (
                    <div key={lineage.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-green-800">
                              {lineage.source_table_name || 'Unknown Table'}
                            </div>
                            <div className="text-xs text-green-600">
                              {lineage.source_schema_name}.{lineage.source_database_name || 'Database'}
                            </div>
                          </div>
                        </div>
                        {lineage.transformation_type && (
                          <Badge variant="outline" className="text-xs">
                            {lineage.transformation_type}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Table className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-sm font-medium">
                          {lineage.source_column_name || 'Unknown Column'}
                        </span>
                        <span className="text-xs text-slate-500">
                          → {column?.name}
                        </span>
                      </div>
                      
                      {lineage.transformation_logic && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <div className="text-xs text-slate-600 font-medium mb-1">Transformation Logic:</div>
                          <code className="text-xs text-slate-800 block truncate">
                            {lineage.transformation_logic}
                          </code>
                        </div>
                      )}
                      
                      {lineage.confidence && (
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>Confidence: {lineage.confidence}%</span>
                          {lineage.created_at && (
                            <span>Updated: {new Date(lineage.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Downstream Lineage */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <ArrowDown className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm">Downstream Targets ({downstreamLineage.length})</h4>
              </div>
              
              {downstreamLineage.length === 0 ? (
                <p className="text-xs text-slate-500 ml-6">No downstream dependencies</p>
              ) : (
                <div className="space-y-3 ml-6">
                  {downstreamLineage.map((lineage) => (
                    <div key={lineage.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-blue-800">
                              {lineage.target_table_name || 'Unknown Table'}
                            </div>
                            <div className="text-xs text-blue-600">
                              {lineage.target_schema_name}.{lineage.target_database_name || 'Database'}
                            </div>
                          </div>
                        </div>
                        {lineage.transformation_type && (
                          <Badge variant="outline" className="text-xs">
                            {lineage.transformation_type}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Table className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          {column?.name} →
                        </span>
                        <span className="font-mono text-sm font-medium">
                          {lineage.target_column_name || 'Unknown Column'}
                        </span>
                      </div>
                      
                      {lineage.transformation_logic && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <div className="text-xs text-slate-600 font-medium mb-1">Transformation Logic:</div>
                          <code className="text-xs text-slate-800 block truncate">
                            {lineage.transformation_logic}
                          </code>
                        </div>
                      )}
                      
                      {lineage.confidence && (
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>Confidence: {lineage.confidence}%</span>
                          {lineage.created_at && (
                            <span>Updated: {new Date(lineage.created_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="pt-3 border-t">
              <div className="text-xs text-slate-600">
                Total: {upstreamLineage.length + downstreamLineage.length} lineage connections
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}