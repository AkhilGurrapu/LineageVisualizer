import { MiniMap as ReactFlowMiniMap } from "reactflow";

export default function MiniMap() {
  return (
    <div className="absolute bottom-6 left-6 w-48 h-32 bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden" data-testid="mini-map">
      <div className="absolute top-2 left-2 text-xs text-slate-600 font-medium z-10">
        Mini Map
      </div>
      
      <ReactFlowMiniMap
        nodeColor={(node) => {
          switch (node.data?.table?.tableType) {
            case "source": return "#dbeafe";
            case "intermediate": return "#e0e7ff";
            case "analytics": return "#d1fae5";
            case "staging": return "#f3e8ff";
            default: return "#f8fafc";
          }
        }}
        nodeStrokeWidth={2}
        nodeStrokeColor="#cbd5e1"
        className="bg-slate-50"
        style={{
          backgroundColor: "#f8fafc",
        }}
      />
    </div>
  );
}
