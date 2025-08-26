import { useState } from "react";
import { type Project } from "@shared/schema";
import { ChevronDown, ChevronRight, Folder, File, Database } from "lucide-react";

interface FileTreeProps {
  project?: Project;
}

export default function FileTree({ project }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!project) return null;

  return null;
}