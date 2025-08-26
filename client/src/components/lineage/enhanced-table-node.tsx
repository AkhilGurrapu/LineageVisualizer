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

  const handleToggleExpand = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    data.onExpand?.(table.id, newExpanded);
  }, [isExpanded, table.id, data]);

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) {
      setIsExpanded(true);
      data.onExpand?.(table.id, true);
    }
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
    // Remove all colored highlighting for cleaner interface
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getHighlightStyle = () => {
    if (selected) {
      return 'table-node-highlighted';
    }
    if (isHighlighted) {
      return 'table-node-highlighted';
    }
    return 'table-node-gradient hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out';
  };

  if (isMinimized) {
    return (
      <div className={`rounded-xl p-3 min-w-[140px] backdrop-blur-sm border-2 ${getHighlightStyle()}`}>
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !border-2 !border-white" />
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !border-2 !border-white" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTableTypeIcon()}
            <span className="font-semibold text-sm truncate text-slate-800">{table.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="h-7 w-7 p-0 hover:bg-blue-100 transition-colors"
            data-testid="button-expand"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl shadow-lg min-w-[320px] max-w-[450px] cursor-pointer backdrop-blur-sm border-2 ${getHighlightStyle()}`}
      onClick={handleNodeClick}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-4 !h-4 !border-2 !border-white !bg-blue-500 hover:!bg-blue-600 transition-colors" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-4 !h-4 !border-2 !border-white !bg-blue-500 hover:!bg-blue-600 transition-colors" 
      />
      
      {/* Table Header */}
      <div className="p-5 border-b bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              {getTableTypeIcon()}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{table.name}</h3>
            {table.dataClassification && (
              <Badge variant="outline" className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300 shadow-sm">
                <Shield className="w-3 h-3 mr-1 text-slate-600" />
                {table.dataClassification}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors rounded-lg"
              data-testid={isExpanded ? "button-collapse" : "button-expand"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors rounded-lg"
              data-testid="button-minimize"
            >
              <Minus className="w-4 h-4 text-slate-600" />
            </Button>
          </div>
        </div>
        
        {table.description && (
          <p className="text-sm text-slate-700 mb-3 leading-relaxed">{table.description}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="capitalize text-slate-600 font-medium">{table.tableType?.replace('_', ' ')}</span>
          </div>
          {table.rowCount && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-600 font-medium">{table.rowCount.toLocaleString()} rows</span>
            </div>
          )}
        </div>

        {Array.isArray(table.tags) && table.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {table.tags.slice(0, 3).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {table.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700">
                +{table.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Expanded Columns Section */}
      {isExpanded && (
        <div 
          className="p-5 max-h-80 overflow-y-auto"
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {isLoading ? (
            <div className="text-sm text-slate-500 py-4 text-center">Loading columns...</div>
          ) : columns.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">No columns found</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                <span>Columns ({columns.length})</span>
              </div>
              {columns.map((column) => {
                const isColumnHighlighted = highlightedColumns.has(column.id);
                const isColumnSelected = selectedColumn === column.id;
                
                return (
                  <div
                    key={column.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColumnClick(column.id);
                    }}
                    className={`
                      p-3 rounded-lg cursor-pointer text-sm transition-all duration-300 transform
                      ${isColumnSelected 
                        ? 'column-selected' 
                        : isColumnHighlighted 
                        ? 'column-highlighted' 
                        : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-md hover:scale-[1.01] border border-transparent'
                      }
                    `}
                    data-testid={`column-${column.name}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          <span className="font-mono font-semibold truncate text-slate-800">{column.name}</span>
                        </div>
                        <span className="text-slate-600 text-sm font-medium bg-slate-100 px-2 py-1 rounded">{column.dataType}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-3">
                        {column.isPrimaryKey && (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-amber-50 text-amber-700 border-amber-200 font-medium">PK</Badge>
                        )}
                        {column.isNullable === false && (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 font-medium">NN</Badge>
                        )}
                        {column.dataClassification === 'sensitive' && (
                          <Shield className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {column.description && (
                      <div className="text-slate-600 text-sm mt-2 leading-relaxed">
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