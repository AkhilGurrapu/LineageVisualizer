import { useState } from "react";
import { type Project } from "@shared/schema";
import { ChevronDown, ChevronRight, Folder, File, Database } from "lucide-react";

interface FileTreeProps {
  project?: Project;
}

export default function FileTree({ project }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!project) return null;

  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border p-3 w-64">
      <div className="flex items-center space-x-2 mb-2">
        <Database className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm">{project.name}</span>
      </div>
      
      <div className="text-xs text-slate-600 mb-2">
        {project.description}
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{project.modelCount} models</span>
        <span>{project.sourceCount} sources</span>
      </div>
    </div>
  );
}