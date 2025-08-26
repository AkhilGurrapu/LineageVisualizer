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
import FileTree from "./file-tree";
import CanvasControls from "./canvas-controls";
import MiniMap from "./mini-map";
import ColumnLineagePanel from "./column-lineage-panel";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Target, GitBranch, Zap, RotateCcw, Info } from "lucide-react";

interface LineageCanvasProps {
  tables: Table[];
  connections: TableLineage[];
  project?: Project;
}

function LineageCanvasInner({ tables, connections, project }: LineageCanvasProps) {
  const nodeTypes = useMemo(() => ({
    table: EnhancedTableNode,
  }), []);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [highlightedColumns, setHighlightedColumns] = useState<Set<string>>(new Set());
  const [highlightedTables, setHighlightedTables] = useState<Set<string>>(new Set());
  const [lineageMode, setLineageMode] = useState<'table' | 'column'>('table');
  const [showLineagePanel, setShowLineagePanel] = useState(false);
  const [lineagePanelPosition, setLineagePanelPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const [showFileTree, setShowFileTree] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [autoLayout, setAutoLayout] = useState(true);
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
  const handleColumnSelect = useCallback(async (columnId: string, tableId: string, event?: MouseEvent) => {
    setSelectedColumn(columnId);
    setSelectedTable(tableId);
    setLineageMode('column');
    setShowLineagePanel(true);
    
    // Position panel at top-right of the node
    if (tableId) {
      // Get the actual node element from the DOM
      const nodeElement = document.querySelector(`[data-id="${tableId}"]`);
      
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        setLineagePanelPosition({ 
          x: rect.right + 10,  // Right edge of node + small gap
          y: rect.top - 10     // Top of node with small offset
        });
      }
    }

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
    setShowLineagePanel(false);
    setLineagePanelPosition(undefined);
  }, []);

  // Generate dynamic node positions with better spacing
  const generateNodePositions = useCallback((tables: Table[]) => {
    const nodesWithoutPosition = tables.filter(table => !table.position);
    
    if (nodesWithoutPosition.length === 0) return tables;
    
    // Advanced grid layout with dynamic spacing
    const cols = Math.ceil(Math.sqrt(tables.length));
    const baseSpacing = { x: 400, y: 300 }; // Increased spacing for better visual appeal
    const padding = { x: 100, y: 100 };
    
    return tables.map((table, index) => {
      if (table.position) return table;
      
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Add some randomness and spacing variation for organic feel
      const jitterX = (Math.random() - 0.5) * 50;
      const jitterY = (Math.random() - 0.5) * 50;
      
      return {
        ...table,
        position: {
          x: padding.x + col * baseSpacing.x + jitterX,
          y: padding.y + row * baseSpacing.y + jitterY
        }
      };
    });
  }, []);

  // Convert tables to React Flow nodes with enhanced data
  const initialNodes: Node[] = useMemo(() => {
    const positionedTables = generateNodePositions(tables);
    
    return positionedTables.map((table) => {
      const isHighlighted = highlightedTables.has(table.id);
      const isSelected = selectedTable === table.id;
      
      return {
        id: table.id,
        type: 'table',
        position: table.position as { x: number; y: number },
        data: { 
          table,
          isConnectable: true,
          selectedColumn,
          highlightedColumns,
          onColumnSelect: handleColumnSelect,
          isHighlighted,
          lineageLevel: isHighlighted ? (selectedTable === table.id ? null : 'connected') : null,
          onExpand: (tableId: string, expanded: boolean) => {
            console.log(`Table ${tableId} ${expanded ? 'expanded' : 'collapsed'}`);
          }
        },
        selected: isSelected,
        className: isHighlighted ? 'highlighted-node' : '',
      };
    });
  }, [tables, selectedColumn, highlightedColumns, highlightedTables, selectedTable, handleColumnSelect, generateNodePositions]);

  // Clean edge styling for better clarity
  const getEdgeStyle = useCallback((connection: TableLineage) => {
    const isHighlighted = highlightedTables.has(connection.sourceTableId) || 
                         highlightedTables.has(connection.targetTableId);
    
    if (lineageMode === 'column' && isHighlighted) {
      return {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: '0',
      };
    }
    
    // Simple, clean styling based on transformation type
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
        style: {
          ...edgeStyle,
          cursor: 'pointer'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeStyle.stroke,
        },
        data: {
          transformationType: connection.transformationType,
          isHighlighted,
          connection
        },
        label: connection.transformationType,
        labelStyle: { 
          fontSize: 11, 
          fontWeight: 600,
          fill: edgeStyle.stroke,
          backgroundColor: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          border: `1px solid ${edgeStyle.stroke}`,
          cursor: 'pointer'
        },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 6,
        interactionWidth: 20
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

  // Handle edge clicks to show relationship details
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    console.log('Edge clicked:', edge);
    
    // Find the connection data
    const connection = connections.find(conn => conn.id === edge.id);
    if (connection) {
      // Highlight the connected tables
      const highlightedTabs = new Set([connection.sourceTableId, connection.targetTableId]);
      setHighlightedTables(highlightedTabs);
      
      // Show transformation type in console for now
      console.log(`Relationship: ${connection.transformationType} from ${connection.sourceTableId} to ${connection.targetTableId}`);
      
      // Find the nodes for the connected tables
      const sourceNode = nodes.find(n => n.id === connection.sourceTableId);
      const targetNode = nodes.find(n => n.id === connection.targetTableId);
      
      if (sourceNode && targetNode && reactFlowInstance) {
        // Calculate center point between the two nodes
        const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
        const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
        
        // Focus on the relationship
        reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.0 });
      }
    }
  }, [connections, nodes, reactFlowInstance]);

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


      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition={undefined}
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

      <FileTree project={project} />
      <CanvasControls />
      
      {/* Column Lineage Panel */}
      {showLineagePanel && selectedColumn && (
        <ColumnLineagePanel
          columnId={selectedColumn}
          tableId={selectedTable}
          position={lineagePanelPosition}
          onClose={() => {
            setShowLineagePanel(false);
            setLineagePanelPosition(undefined);
          }}
        />
      )}
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
