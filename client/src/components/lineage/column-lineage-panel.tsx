import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronRight, ArrowUpRight, ArrowDownLeft, Database, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ColumnLineage, type Column, type Table } from "@shared/schema";

interface ColumnLineagePanelProps {
  columnId: string | null;
  tableId: string | null;
  onClose: () => void;
}

export default function ColumnLineagePanel({ columnId, tableId, onClose }: ColumnLineagePanelProps) {
  const [activeTab, setActiveTab] = useState<'upstream' | 'downstream'>('upstream');

  // Fetch column details
  const { data: column } = useQuery<Column>({
    queryKey: ['/api/columns', columnId],
    enabled: !!columnId
  });

  // Fetch table details
  const { data: table } = useQuery<Table>({
    queryKey: ['/api/tables', tableId],
    enabled: !!tableId
  });

  // Fetch upstream lineage
  const { data: upstreamLineage = [], isLoading: isUpstreamLoading } = useQuery<ColumnLineage[]>({
    queryKey: ['/api/column-lineage/upstream', columnId],
    enabled: !!columnId
  });

  // Fetch downstream lineage
  const { data: downstreamLineage = [], isLoading: isDownstreamLoading } = useQuery<ColumnLineage[]>({
    queryKey: ['/api/column-lineage/downstream', columnId],
    enabled: !!columnId
  });

  const getTransformationColor = (type: string) => {
    switch (type) {
      case 'direct_copy': return 'bg-green-100 text-green-800';
      case 'transformation': return 'bg-blue-100 text-blue-800';
      case 'aggregation': return 'bg-purple-100 text-purple-800';
      case 'join': return 'bg-indigo-100 text-indigo-800';
      case 'filter': return 'bg-amber-100 text-amber-800';
      case 'union': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const LineageItem = ({ lineage, direction }: { lineage: ColumnLineage; direction: 'upstream' | 'downstream' }) => {
    const targetColumnId = direction === 'upstream' ? lineage.sourceColumnId : lineage.targetColumnId;
    
    const { data: relatedColumn } = useQuery<Column>({
      queryKey: ['/api/columns', targetColumnId],
      enabled: !!targetColumnId
    });

    const { data: relatedTable } = useQuery<Table>({
      queryKey: ['/api/tables', relatedColumn?.tableId],
      enabled: !!relatedColumn?.tableId
    });

    return (
      <div className="p-3 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {direction === 'upstream' ? (
                <ArrowDownLeft className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
              )}
              <div className="font-mono text-sm">
                {relatedColumn?.name || targetColumnId}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              <Database className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-600">
                {relatedTable?.name || 'Loading table...'}
              </span>
            </div>
            
            {lineage.transformationLogic && (
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded font-mono">
                {lineage.transformationLogic}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <Badge 
              variant="secondary" 
              className={getTransformationColor(lineage.transformationType)}
            >
              {lineage.transformationType}
            </Badge>
            
            {lineage.confidence && (
              <div className="text-xs text-slate-500">
                {Math.round(lineage.confidence * 100)}% confidence
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-xl border z-20 max-h-[calc(100vh-2rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <GitBranch className="w-5 h-5" />
            <span>Column Lineage</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {column && table && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">{table.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-slate-800">{column.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{column.dataType}</Badge>
              {column.isPrimaryKey && <Badge variant="default">Primary Key</Badge>}
              {column.isForeignKey && <Badge variant="secondary">Foreign Key</Badge>}
              {column.isPii && <Badge variant="destructive">PII</Badge>}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'upstream'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('upstream')}
          >
            <div className="flex items-center justify-center space-x-2">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Upstream ({upstreamLineage.length})</span>
            </div>
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'downstream'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('downstream')}
          >
            <div className="flex items-center justify-center space-x-2">
              <ArrowUpRight className="w-4 h-4" />
              <span>Downstream ({downstreamLineage.length})</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {activeTab === 'upstream' && (
              <>
                {isUpstreamLoading ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    Loading upstream lineage...
                  </div>
                ) : upstreamLineage.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    No upstream dependencies found
                  </div>
                ) : (
                  upstreamLineage.map((lineage) => (
                    <LineageItem key={lineage.id} lineage={lineage} direction="upstream" />
                  ))
                )}
              </>
            )}

            {activeTab === 'downstream' && (
              <>
                {isDownstreamLoading ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    Loading downstream lineage...
                  </div>
                ) : downstreamLineage.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    No downstream dependencies found
                  </div>
                ) : (
                  downstreamLineage.map((lineage) => (
                    <LineageItem key={lineage.id} lineage={lineage} direction="downstream" />
                  ))
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t p-4">
          <div className="flex justify-between text-xs text-slate-500">
            <span>
              Lineage tracked at column level
            </span>
            <span>
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </div>
  );
}