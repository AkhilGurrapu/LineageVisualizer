import { MiniMap as ReactFlowMiniMap } from "reactflow";

export default function MiniMap() {
  return (
    <div className="absolute bottom-20 right-4 z-10">
      <ReactFlowMiniMap
        nodeColor="#e2e8f0"
        maskColor="rgba(0, 0, 0, 0.1)"
        style={{
          height: 120,
          width: 180,
          backgroundColor: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
        }}
      />
    </div>
  );
}