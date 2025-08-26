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
      className="fixed z-50 bg-white rounded-lg shadow-xl border w-[280px] max-h-[300px] overflow-y-auto"
      style={{
        top: position ? Math.max(position.y - 50, 10) : '50%',
        left: position ? Math.min(position.x + 30, window.innerWidth - 300) : '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)'
      }}
    >
      {/* Header */}
      <div className="p-2 border-b bg-slate-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="font-medium text-sm text-slate-900">{column?.name}</h3>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-6 w-6">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-2">
        {loading ? (
          <div className="text-center text-slate-500 py-2 text-xs">
            Loading...
          </div>
        ) : (
          <>
            {/* Upstream */}
            {upstreamLineage.length > 0 && (
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <ArrowUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium">Sources ({upstreamLineage.length})</span>
                </div>
                <div className="space-y-1 ml-4">
                  {upstreamLineage.slice(0, 3).map((lineage) => (
                    <div key={lineage.id} className="text-xs">
                      <span className="font-mono text-green-700">
                        {lineage.source_column_name}
                      </span>
                      <span className="text-slate-500 mx-1">from</span>
                      <span className="text-slate-700">
                        {lineage.source_table_name}
                      </span>
                    </div>
                  ))}
                  {upstreamLineage.length > 3 && (
                    <div className="text-xs text-slate-400">+{upstreamLineage.length - 3} more</div>
                  )}
                </div>
              </div>
            )}

            {/* Downstream */}
            {downstreamLineage.length > 0 && (
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <ArrowDown className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium">Targets ({downstreamLineage.length})</span>
                </div>
                <div className="space-y-1 ml-4">
                  {downstreamLineage.slice(0, 3).map((lineage) => (
                    <div key={lineage.id} className="text-xs">
                      <span className="font-mono text-blue-700">
                        {lineage.target_column_name}
                      </span>
                      <span className="text-slate-500 mx-1">in</span>
                      <span className="text-slate-700">
                        {lineage.target_table_name}
                      </span>
                    </div>
                  ))}
                  {downstreamLineage.length > 3 && (
                    <div className="text-xs text-slate-400">+{downstreamLineage.length - 3} more</div>
                  )}
                </div>
              </div>
            )}

            {/* No lineage */}
            {upstreamLineage.length === 0 && downstreamLineage.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-2">
                No lineage connections
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}