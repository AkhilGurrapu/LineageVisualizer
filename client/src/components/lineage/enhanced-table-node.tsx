import { memo, useState, useCallback } from "react";
import { Handle, Position } from "reactflow";
import { type Table, type Column } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Table as TableIcon, Eye, Database, Shield, Tag, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EnhancedTableNodeProps {
  data: {
    table: Table;
    selectedColumn?: string | null;
    highlightedColumns: Set<string>;
    onColumnSelect: (columnId: string, tableId: string) => void;
    isHighlighted: boolean;
    lineageLevel: 'source' | 'target' | null;
    onExpand?: (tableId: string, expanded: boolean) => void;
  };
  selected?: boolean;
}

export default memo(function EnhancedTableNode({ data, selected }: EnhancedTableNodeProps) {
  const { table, selectedColumn, highlightedColumns, onColumnSelect, isHighlighted, lineageLevel } = data;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const { data: columns = [], isLoading } = useQuery<Column[]>({
    queryKey: ['/api/tables', table.id, 'columns'],
    enabled: isExpanded,
  });

  const handleToggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    data.onExpand?.(table.id, newExpanded);
  }, [isExpanded, table.id, data]);

  const handleColumnClick = useCallback((columnId: string) => {
    onColumnSelect(columnId, table.id);
  }, [onColumnSelect, table.id]);

  const getTableTypeIcon = () => {
    switch (table.tableType) {
      case 'view':
        return <Eye className="w-4 h-4 text-green-600" />;
      case 'materialized_view':
        return <Database className="w-4 h-4 text-blue-600" />;
      default:
        return <TableIcon className="w-4 h-4 text-slate-600" />;
    }
  };

  const getDataClassificationColor = () => {
    switch (table.dataClassification) {
      case 'sensitive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'internal':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'public':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getHighlightStyle = () => {
    if (lineageLevel === 'source') {
      return 'ring-4 ring-emerald-400 shadow-2xl scale-105';
    }
    if (lineageLevel === 'target') {
      return 'ring-2 ring-blue-400 shadow-lg';
    }
    if (isHighlighted) {
      return 'ring-2 ring-purple-400 shadow-lg';
    }
    if (selected) {
      return 'ring-2 ring-blue-500 shadow-lg';
    }
    return 'hover:shadow-lg transition-all duration-200';
  };

  if (isMinimized) {
    return (
      <div className={`bg-white border rounded-lg p-2 min-w-[120px] ${getHighlightStyle()}`}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTableTypeIcon()}
            <span className="font-medium text-sm truncate">{table.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="h-6 w-6 p-0"
            data-testid="button-expand"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm min-w-[280px] max-w-[400px] ${getHighlightStyle()}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      {/* Table Header */}
      <div className="p-4 border-b bg-slate-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getTableTypeIcon()}
            <h3 className="font-semibold text-slate-900 text-sm">{table.name}</h3>
            {table.dataClassification && (
              <Badge variant="outline" className={`text-xs ${getDataClassificationColor()}`}>
                <Shield className="w-3 h-3 mr-1" />
                {table.dataClassification}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-6 w-6 p-0"
              data-testid={isExpanded ? "button-collapse" : "button-expand"}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0"
              data-testid="button-minimize"
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {table.description && (
          <p className="text-xs text-slate-600 mb-2">{table.description}</p>
        )}
        
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span className="capitalize">{table.tableType?.replace('_', ' ')}</span>
          {table.rowCount && <span>{table.rowCount.toLocaleString()} rows</span>}
        </div>

        {table.tags && table.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {table.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {table.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{table.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Expanded Columns Section */}
      {isExpanded && (
        <div className="p-3 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-xs text-slate-500 py-2">Loading columns...</div>
          ) : columns.length === 0 ? (
            <div className="text-xs text-slate-500 py-2">No columns found</div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-700 mb-2">
                Columns ({columns.length})
              </div>
              {columns.map((column) => {
                const isColumnHighlighted = highlightedColumns.has(column.id);
                const isColumnSelected = selectedColumn === column.id;
                
                return (
                  <div
                    key={column.id}
                    onClick={() => handleColumnClick(column.id)}
                    className={`
                      p-2 rounded cursor-pointer text-xs transition-all duration-150
                      ${isColumnSelected 
                        ? 'bg-emerald-100 border border-emerald-300 ring-1 ring-emerald-400' 
                        : isColumnHighlighted 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-slate-50 border border-transparent'
                      }
                    `}
                    data-testid={`column-${column.name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="font-mono font-medium truncate">{column.name}</span>
                        <span className="text-slate-500 text-xs">{column.dataType}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {column.isPrimaryKey && (
                          <Badge variant="outline" className="text-xs px-1 py-0">PK</Badge>
                        )}
                        {column.isNullable === false && (
                          <Badge variant="outline" className="text-xs px-1 py-0">NN</Badge>
                        )}
                        {column.dataClassification === 'sensitive' && (
                          <Shield className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {column.description && (
                      <div className="text-slate-500 text-xs mt-1 truncate">
                        {column.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});