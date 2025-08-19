import { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery } from "@tanstack/react-query";

import { 
  type Table, 
  type TableLineage, 
  type Project, 
  type ColumnLineage,
  type Column 
} from "@shared/schema";
import EnhancedTableNode from "./enhanced-table-node";
// Removed unused components for cleaner, focused interface
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Target, GitBranch, Zap, RotateCcw, Info } from "lucide-react";

const nodeTypes = {
  table: EnhancedTableNode,
};

interface LineageCanvasProps {
  tables: Table[];
  connections: TableLineage[];
  project?: Project;
}

function LineageCanvasInner({ tables, connections, project }: LineageCanvasProps) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [highlightedColumns, setHighlightedColumns] = useState<Set<string>>(new Set());
  const [highlightedTables, setHighlightedTables] = useState<Set<string>>(new Set());
  const [lineageMode, setLineageMode] = useState<'table' | 'column'>('table');
  const reactFlowInstance = useReactFlow();

  // Fetch column lineage data
  const { data: columnLineageData = [], isLoading: isColumnLineageLoading } = useQuery<ColumnLineage[]>({
    queryKey: ['/api/column-lineage?withDetails=true']
  });

  // Get all columns for highlighting
  const { data: allColumns = [] } = useQuery<Column[]>({
    queryKey: ['/api/columns'],
    enabled: selectedColumn !== null
  });

  // Handle column selection and lineage triaging
  const handleColumnSelect = useCallback(async (columnId: string, tableId: string) => {
    setSelectedColumn(columnId);
    setSelectedTable(tableId);
    setLineageMode('column');

    try {
      // Fetch upstream and downstream lineage for the selected column
      const [upstreamResponse, downstreamResponse] = await Promise.all([
        apiRequest('GET', `/api/column-lineage/upstream/${columnId}`),
        apiRequest('GET', `/api/column-lineage/downstream/${columnId}`)
      ]);
      
      const upstreamData = await upstreamResponse.json() as ColumnLineage[];
      const downstreamData = await downstreamResponse.json() as ColumnLineage[];
      const lineageData = [...upstreamData, ...downstreamData];
      
      // Extract highlighted columns and tables from lineage
      const highlightedCols = new Set<string>();
      const highlightedTabs = new Set<string>();
      
      lineageData.forEach(lineage => {
        highlightedCols.add(lineage.sourceColumnId);
        highlightedCols.add(lineage.targetColumnId);
        // Add table IDs from column relationships
        // Note: We'd need to fetch table info from column data
      });
      
      highlightedCols.add(columnId);
      highlightedTabs.add(tableId);
      
      setHighlightedColumns(highlightedCols);
      setHighlightedTables(highlightedTabs);
      
    } catch (error) {
      console.error('Failed to fetch column lineage:', error);
    }
  }, []);

  // Clear selection and highlighting
  const clearSelection = useCallback(() => {
    setSelectedColumn(null);
    setSelectedTable(null);
    setHighlightedColumns(new Set());
    setHighlightedTables(new Set());
    setLineageMode('table');
  }, []);

  // Convert tables to React Flow nodes with enhanced data
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: table.position ? table.position as { x: number; y: number } : { x: 0, y: 0 },
      data: { 
        table,
        isConnectable: true,
        selectedColumn,
        highlightedColumns,
        onColumnSelect: handleColumnSelect,
        isHighlighted: highlightedTables.has(table.id),
        lineageLevel: selectedTable === table.id ? 'source' : 
                     highlightedTables.has(table.id) ? 'target' : null,
        onExpand: (tableId: string, expanded: boolean) => {
          // Handle table expansion state
          console.log(`Table ${tableId} ${expanded ? 'expanded' : 'collapsed'}`);
        }
      },
    }));
  }, [tables, selectedColumn, highlightedColumns, highlightedTables, selectedTable, handleColumnSelect]);

  // Enhanced edge styling for column lineage
  const getEdgeStyle = useCallback((connection: TableLineage) => {
    const isHighlighted = highlightedTables.has(connection.sourceTableId) || 
                         highlightedTables.has(connection.targetTableId);
    
    if (lineageMode === 'column' && isHighlighted) {
      return {
        stroke: '#10b981', // emerald-500
        strokeWidth: 4,
        strokeDasharray: '0',
      };
    }
    
    switch (connection.transformationType) {
      case 'join':
        return { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '0' }; // blue
      case 'aggregation':
        return { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5,5' }; // purple
      case 'filter':
        return { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '3,3' }; // amber
      case 'union':
        return { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '8,2' }; // red
      default:
        return { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '0' }; // gray
    }
  }, [lineageMode, highlightedTables]);

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((connection) => {
      const edgeStyle = getEdgeStyle(connection);
      const isHighlighted = highlightedTables.has(connection.sourceTableId) || 
                           highlightedTables.has(connection.targetTableId);
      
      return {
        id: connection.id,
        source: connection.sourceTableId,
        target: connection.targetTableId,
        type: 'default',
        animated: isHighlighted && lineageMode === 'column',
        style: edgeStyle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
        data: {
          transformationType: connection.transformationType,
          isHighlighted
        },
        label: lineageMode === 'column' && isHighlighted ? connection.transformationType : '',
        labelStyle: { 
          fontSize: 12, 
          fontWeight: 600,
          fill: edgeStyle.stroke,
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: '4px'
        }
      };
    });
  }, [connections, getEdgeStyle, highlightedTables, lineageMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when dependencies change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when dependencies change
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node position updates
  const onNodeDragStop = useCallback(
    async (event: any, node: Node) => {
      try {
        await apiRequest('PATCH', `/api/tables/${node.id}`, {
          position: node.position
        });
        
        // Invalidate and refetch the tables data
        queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      } catch (error) {
        console.error('Failed to update table position:', error);
      }
    },
    []
  );

  // Focus on selected table/column
  const focusOnSelection = useCallback(() => {
    if (selectedTable && reactFlowInstance) {
      const node = nodes.find(n => n.id === selectedTable);
      if (node) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2 });
      }
    }
  }, [selectedTable, reactFlowInstance, nodes]);

  return (
    <div className="w-full h-full relative" data-testid="lineage-canvas">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Button
            variant={lineageMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setLineageMode('table');
              clearSelection();
            }}
            className="text-xs"
          >
            <GitBranch className="w-3 h-3 mr-1" />
            Table
          </Button>
          <Button
            variant={lineageMode === 'column' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLineageMode('column')}
            className="text-xs"
            disabled={!selectedColumn}
          >
            <Target className="w-3 h-3 mr-1" />
            Column
          </Button>
        </div>
        
        {selectedColumn && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs text-slate-600">
              Selected: Column lineage mode
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={focusOnSelection}
                className="text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Focus
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lineage Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">
          Transformation Types
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Join</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-purple-500" style={{ borderStyle: 'dashed' }}></div>
            <span>Aggregation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-amber-500" style={{ borderStyle: 'dotted' }}></div>
            <span>Filter</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span>Union</span>
          </div>
          {lineageMode === 'column' && (
            <div className="flex items-center space-x-2 pt-1 border-t">
              <div className="w-4 h-1 bg-emerald-500"></div>
              <span>Column Path</span>
            </div>
          )}
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        className="bg-slate-50"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          color="#e2e8f0" 
          gap={20} 
          size={1}
        />
        <Controls />
      </ReactFlow>

      {/* Enhanced lineage visualization focused on Snowflake-style objects */}
    </div>
  );
}

export default function LineageCanvas(props: LineageCanvasProps) {
  return (
    <ReactFlowProvider>
      <LineageCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
