import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Column, type ColumnLineage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, ArrowUp, ArrowDown, GitBranch } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ColumnLineagePanelProps {
  columnId: string;
  tableId: string | null;
  onClose: () => void;
}

export default function ColumnLineagePanel({ columnId, tableId, onClose }: ColumnLineagePanelProps) {
  const [upstreamLineage, setUpstreamLineage] = useState<ColumnLineage[]>([]);
  const [downstreamLineage, setDownstreamLineage] = useState<ColumnLineage[]>([]);
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
        
        const upstreamData = await upstreamResponse.json() as ColumnLineage[];
        const downstreamData = await downstreamResponse.json() as ColumnLineage[];
        
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
    <div className="absolute top-4 left-80 z-20 bg-white rounded-lg shadow-xl border w-96 max-h-96 overflow-y-auto">
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
                <div className="space-y-2 ml-6">
                  {upstreamLineage.map((lineage) => (
                    <div key={lineage.id} className="p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-xs font-medium text-green-800">
                        Source Column ID: {lineage.sourceColumnId}
                      </div>
                      {lineage.transformationType && (
                        <div className="text-xs text-green-600 mt-1">
                          Transform: {lineage.transformationType}
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
                <div className="space-y-2 ml-6">
                  {downstreamLineage.map((lineage) => (
                    <div key={lineage.id} className="p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs font-medium text-blue-800">
                        Target Column ID: {lineage.targetColumnId}
                      </div>
                      {lineage.transformationType && (
                        <div className="text-xs text-blue-600 mt-1">
                          Transform: {lineage.transformationType}
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