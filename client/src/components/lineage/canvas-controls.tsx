import { Plus, Minus, Maximize, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactFlow } from "reactflow";

export default function CanvasControls() {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleFitView = () => {
    fitView({ padding: 0.2 });
  };

  const handleResetView = () => {
    setCenter(400, 300, { zoom: 1 });
  };

  return (
    <div className="absolute bottom-6 right-6 flex flex-col space-y-2" data-testid="canvas-controls">
      <Button
        variant="outline"
        size="sm"
        className="bg-white border border-slate-300 rounded-lg p-2 shadow-sm hover:bg-slate-50"
        onClick={handleZoomIn}
        title="Zoom In"
        data-testid="zoom-in-button"
      >
        <Plus className="w-4 h-4 text-slate-600" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="bg-white border border-slate-300 rounded-lg p-2 shadow-sm hover:bg-slate-50"
        onClick={handleZoomOut}
        title="Zoom Out"
        data-testid="zoom-out-button"
      >
        <Minus className="w-4 h-4 text-slate-600" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="bg-white border border-slate-300 rounded-lg p-2 shadow-sm hover:bg-slate-50"
        onClick={handleFitView}
        title="Fit to Screen"
        data-testid="fit-view-button"
      >
        <Maximize className="w-4 h-4 text-slate-600" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="bg-white border border-slate-300 rounded-lg p-2 shadow-sm hover:bg-slate-50"
        onClick={handleResetView}
        title="Reset View"
        data-testid="reset-view-button"
      >
        <Home className="w-4 h-4 text-slate-600" />
      </Button>
    </div>
  );
}
