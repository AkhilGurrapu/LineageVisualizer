import { useCallback, useMemo, useState } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";

import { type Table, type LineageConnection, type Project } from "@shared/schema";
import TableNode from "./table-node";
import FileTree from "./file-tree";
import CanvasControls from "./canvas-controls";
import MiniMap from "./mini-map";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const nodeTypes = {
  table: TableNode,
};

interface LineageCanvasProps {
  tables: Table[];
  connections: LineageConnection[];
  project?: Project;
}

function LineageCanvasInner({ tables, connections, project }: LineageCanvasProps) {
  // Convert tables to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: table.position as { x: number; y: number },
      data: { 
        table,
        isConnectable: true 
      },
    }));
  }, [tables]);

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceTableId,
      target: connection.targetTableId,
      type: 'default',
      animated: true,
      style: { 
        stroke: '#3b82f6', 
        strokeWidth: 2 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
      data: {
        transformationType: connection.transformationType
      }
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="w-full h-full relative" data-testid="lineage-canvas">
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
      </ReactFlow>

      <FileTree project={project} />
      <CanvasControls />
      <MiniMap />
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
