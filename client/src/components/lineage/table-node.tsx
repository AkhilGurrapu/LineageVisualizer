import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { Table, Key, Link, ChevronDown, ChevronUp, Eye, Target, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Table as TableType, type Column } from "@shared/schema";
import { cn } from "@/lib/utils";

export interface TableNodeProps {
  data: {
    table: TableType;
    isConnectable?: boolean;
    selectedColumn?: string;
    highlightedColumns?: Set<string>;
    onColumnSelect?: (columnId: string, tableId: string) => void;
    isHighlighted?: boolean;
    lineageLevel?: 'source' | 'target' | 'intermediate' | null;
  };
}

function TableNode({ data }: TableNodeProps) {
  const { table, selectedColumn, highlightedColumns, onColumnSelect, isHighlighted, lineageLevel } = data;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  
  const { data: columns = [], isLoading } = useQuery<Column[]>({
    queryKey: ['/api/tables', table.id, 'columns'],
  });

  const getTableTypeColor = (tableType: string) => {
    switch (tableType) {
      case "table": return "bg-blue-50 text-blue-600 border-blue-200";
      case "view": return "bg-indigo-50 text-indigo-600 border-indigo-200";
      case "materialized_view": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "external_table": return "bg-purple-50 text-purple-600 border-purple-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getLineageHighlight = () => {
    if (!isHighlighted) return "";
    switch (lineageLevel) {
      case "source": return "ring-2 ring-green-400 shadow-green-200";
      case "target": return "ring-2 ring-red-400 shadow-red-200";
      case "intermediate": return "ring-2 ring-yellow-400 shadow-yellow-200";
      default: return "ring-2 ring-blue-400 shadow-blue-200";
    }
  };

  const getDataClassificationIcon = (classification: string) => {
    switch (classification) {
      case "confidential": return <Shield className="w-3 h-3 text-red-500" />;
      case "internal": return <Eye className="w-3 h-3 text-yellow-500" />;
      case "public": return <Target className="w-3 h-3 text-green-500" />;
      default: return null;
    }
  };

  const displayColumns = showAllColumns ? columns : columns.slice(0, 5);
  const remainingColumns = Math.max(0, columns.length - 5);

  const handleColumnClick = (column: Column) => {
    if (onColumnSelect) {
      onColumnSelect(column.id, table.id);
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-lg border-2 w-64 transition-all duration-300",
        getTableTypeColor(table.tableType || "table"),
        getLineageHighlight(),
        isHighlighted && "shadow-xl"
      )} 
      data-testid={`table-node-${table.name}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={data.isConnectable}
      />
      
      {/* Table Header */}
      <div className={cn(
        "px-4 py-3 border-b rounded-t-lg cursor-pointer",
        getTableTypeColor(table.tableType || "table")
      )} onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Table className="w-4 h-4 mr-2" />
            <div>
              <h4 className="font-semibold text-sm">{table.name}</h4>
              <p className="text-xs opacity-75">
                {table.schemaId ? `Schema: ${table.schemaId}` : table.tableType || "table"}
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs opacity-75">
            {isLoading ? "Loading..." : `${columns.length} columns`}
          </p>
          {table.rowCount && (
            <span className="text-xs px-2 py-1 bg-white/50 rounded">
              {table.rowCount.toLocaleString()} rows
            </span>
          )}
        </div>
      </div>
      
      {/* Columns List */}
      {isExpanded && (
        <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-xs text-slate-400">Loading columns...</div>
          ) : (
            <>
              {displayColumns.map((column) => {
                const isSelected = selectedColumn === column.id;
                const isHighlightedCol = highlightedColumns?.has(column.id);
                
                return (
                  <div
                    key={column.id}
                    className={cn(
                      "flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all duration-200",
                      "hover:bg-blue-50 hover:shadow-sm",
                      isSelected && "bg-blue-100 ring-2 ring-blue-400 shadow-md",
                      isHighlightedCol && !isSelected && "bg-yellow-50 border border-yellow-300",
                      column.isPii && "border-l-4 border-red-400"
                    )}
                    data-testid={`column-${column.name}`}
                    onClick={() => handleColumnClick(column)}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <span className={cn(
                        "font-mono text-xs",
                        column.isPrimaryKey ? "text-slate-800 font-semibold" : "text-slate-600",
                        isSelected && "text-blue-800"
                      )}>
                        {column.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {column.dataType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {column.isPrimaryKey && <Key className="w-3 h-3 text-yellow-600" />}
                      {column.isForeignKey && !column.isPrimaryKey && <Link className="w-3 h-3 text-blue-600" />}
                      {column.dataClassification && getDataClassificationIcon(column.dataClassification)}
                      {column.isPii && <Shield className="w-3 h-3 text-red-600" />}
                    </div>
                  </div>
                );
              })}
              
              {!showAllColumns && remainingColumns > 0 && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer p-2 w-full text-left rounded hover:bg-blue-50"
                  data-testid="show-all-columns"
                  onClick={() => setShowAllColumns(true)}
                >
                  + Show {remainingColumns} more columns
                </button>
              )}
              
              {showAllColumns && columns.length > 5 && (
                <button
                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer p-2 w-full text-left rounded hover:bg-slate-50"
                  onClick={() => setShowAllColumns(false)}
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Table Tags and Metadata */}
      {isExpanded && table.tags && Array.isArray(table.tags) && table.tags.length > 0 && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-1">
            {table.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {table.tags.length > 3 && (
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                +{table.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        isConnectable={data.isConnectable}
      />
    </div>
  );
}

export default memo(TableNode);
