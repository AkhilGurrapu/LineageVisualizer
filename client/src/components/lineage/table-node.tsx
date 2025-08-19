import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Table, Key, Link } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Table as TableType, type Column } from "@shared/schema";

export interface TableNodeProps {
  data: {
    table: TableType;
    isConnectable?: boolean;
  };
}

function TableNode({ data }: TableNodeProps) {
  const { table } = data;
  
  const { data: columns = [], isLoading } = useQuery<Column[]>({
    queryKey: ['/api/tables', table.id, 'columns'],
  });

  const getTableTypeColor = (tableType: string) => {
    switch (tableType) {
      case "source": return "bg-blue-50 text-blue-600";
      case "intermediate": return "bg-indigo-50 text-indigo-600";
      case "analytics": return "bg-emerald-50 text-emerald-600";
      case "staging": return "bg-purple-50 text-purple-600";
      default: return "bg-gray-50 text-gray-600";
    }
  };

  const visibleColumns = columns.slice(0, 5);
  const remainingColumns = Math.max(0, columns.length - 5);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-56" data-testid={`table-node-${table.name}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-blue-500"
        isConnectable={data.isConnectable}
      />
      
      <div className={`px-4 py-3 border-b border-slate-200 rounded-t-lg ${getTableTypeColor(table.tableType)}`}>
        <div className="flex items-center">
          <Table className="w-4 h-4 mr-2" />
          <h4 className="font-semibold text-slate-800 text-sm">{table.name}</h4>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isLoading ? "Loading..." : `${columns.length} columns`}
        </p>
      </div>
      
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-slate-400">Loading columns...</div>
        ) : (
          <>
            {visibleColumns.map((column) => (
              <div
                key={column.id}
                className="flex items-center justify-between text-sm"
                data-testid={`column-${column.name}`}
              >
                <span className={column.isPrimaryKey ? "text-slate-700 font-medium" : "text-slate-600"}>
                  {column.name}
                </span>
                {column.isPrimaryKey && <Key className="w-3 h-3 text-yellow-500" />}
                {column.isForeignKey && !column.isPrimaryKey && <Link className="w-3 h-3 text-blue-500" />}
              </div>
            ))}
            
            {remainingColumns > 0 && (
              <div className="text-xs text-slate-400 cursor-pointer hover:text-blue-600" data-testid="more-columns">
                + {remainingColumns} more columns
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-blue-500"
        isConnectable={data.isConnectable}
      />
    </div>
  );
}

export default memo(TableNode);
