import { Folder, Table, FolderOpen } from "lucide-react";
import { useState } from "react";
import { type Project } from "@shared/schema";

interface FileTreeProps {
  project?: Project;
}

interface TreeNode {
  name: string;
  type: "folder" | "table";
  status?: "success" | "warning" | "error" | "info";
  children?: TreeNode[];
  expanded?: boolean;
}

const mockTreeData: TreeNode = {
  name: "dbt_shop_online",
  type: "folder",
  expanded: true,
  children: [
    {
      name: "marketing",
      type: "folder",
      expanded: true,
      children: [
        {
          name: "staging",
          type: "folder",
          expanded: true,
          children: [
            {
              name: "CUSTOMERS",
              type: "table",
              status: "warning"
            },
            {
              name: "int_orders", 
              type: "table",
              status: "success"
            },
            {
              name: "order_items",
              type: "table", 
              status: "info"
            },
            {
              name: "orders",
              type: "table",
              status: "success"
            },
            {
              name: "returned_orders",
              type: "table",
              status: "warning"
            }
          ]
        }
      ]
    },
    {
      name: "sources",
      type: "folder"
    },
    {
      name: "staging",
      type: "folder"
    }
  ]
};

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle?: (node: TreeNode) => void;
  onTableClick?: (tableName: string) => void;
}

function TreeItem({ node, level, onToggle, onTableClick }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(node.expanded || false);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.(node);
  };

  const handleTableClick = () => {
    if (node.type === "table") {
      onTableClick?.(node.name);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success": return "text-green-500";
      case "warning": return "text-orange-500"; 
      case "error": return "text-red-500";
      case "info": return "text-blue-500";
      default: return "";
    }
  };

  return (
    <div>
      <div
        className={`flex items-center text-sm cursor-pointer hover:text-blue-600 transition-colors`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={node.type === "folder" ? handleToggle : handleTableClick}
        data-testid={`tree-item-${node.name.toLowerCase()}`}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500 mr-2" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500 mr-2" />
            )}
            <span className={level === 0 ? "font-medium text-slate-700" : "text-slate-600"}>
              {node.name}
            </span>
          </>
        ) : (
          <>
            <Table className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-slate-600">{node.name}</span>
            {node.status && (
              <span className={`ml-auto text-xs ${getStatusColor(node.status)}`}>●</span>
            )}
          </>
        )}
      </div>
      
      {node.children && isExpanded && (
        <div className="space-y-1 mt-1">
          {node.children.map((child, index) => (
            <TreeItem
              key={`${child.name}-${index}`}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onTableClick={onTableClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ project }: FileTreeProps) {
  const handleTableClick = (tableName: string) => {
    console.log("Table clicked:", tableName);
    // TODO: Implement table selection/highlighting in canvas
  };

  const displayProject = project || {
    name: mockTreeData.name,
    modelCount: 22,
    sourceCount: 8
  };

  return (
    <div className="absolute left-4 top-4 w-64 bg-white rounded-lg shadow-sm border border-slate-200 z-10" data-testid="file-tree">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800" data-testid="project-name">
          {displayProject.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1" data-testid="project-stats">
          {displayProject.modelCount} models • {displayProject.sourceCount} sources
        </p>
      </div>
      
      <div className="p-3 max-h-80 overflow-y-auto">
        <div className="space-y-1">
          <TreeItem 
            node={mockTreeData} 
            level={0}
            onTableClick={handleTableClick}
          />
        </div>
      </div>
    </div>
  );
}
