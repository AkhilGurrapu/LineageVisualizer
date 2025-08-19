import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react";

export default function CanvasControls() {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg border p-2 flex space-x-1">
      <Button variant="ghost" size="sm" className="p-2">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="p-2">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="p-2">
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" className="p-2">
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}