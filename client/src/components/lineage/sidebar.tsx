import { 
  BarChart3, 
  Database, 
  Home, 
  AlertTriangle, 
  Users, 
  TestTubeDiagonal, 
  Shield, 
  TrendingUp, 
  Clock, 
  Server, 
  Bell 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    icon: Home,
    label: "Dashboard",
    active: true,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: BarChart3,
    label: "Data Health",
    badge: "New",
    badgeColor: "bg-emerald-100 text-emerald-600"
  },
  {
    icon: Database,
    label: "Catalog"
  }
];

const resourceItems = [
  {
    icon: AlertTriangle,
    label: "Incidents",
    badge: "3",
    badgeColor: "bg-red-100 text-red-600"
  },
  {
    icon: Users,
    label: "Lineage",
    description: "Analyze data & lineage"
  }
];

const testItems = [
  {
    icon: TestTubeDiagonal,
    label: "Test",
    description: "View test results"
  },
  {
    icon: Shield,
    label: "Test Coverage",
    description: "View data & test cover"
  }
];

const performanceItems = [
  {
    icon: TrendingUp,
    label: "Model Performance",
    description: "View model performance"
  },
  {
    icon: Clock,
    label: "Test Performance",
    description: "View test run time & success"
  }
];

const setupItems = [
  {
    icon: Server,
    label: "Environments",
    description: "Manage environments"
  },
  {
    icon: Bell,
    label: "Alert Rules",
    description: "Manage alerts"
  }
];

interface SidebarItemProps {
  item: any;
  isActive?: boolean;
}

function SidebarItem({ item, isActive }: SidebarItemProps) {
  const Icon = item.icon;
  
  return (
    <div 
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
        isActive || item.active 
          ? `${item.color || "text-blue-600"} ${item.bgColor || "bg-blue-50"}` 
          : "text-slate-600 hover:bg-slate-50"
      )}
      data-testid={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="flex-1">{item.label}</span>
      
      {item.badge && (
        <span className={cn("ml-auto text-xs px-2 py-1 rounded-full", item.badgeColor)}>
          {item.badge}
        </span>
      )}
      
      {item.description && (
        <span className="ml-auto text-xs text-slate-400">{item.description}</span>
      )}
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  items: any[];
}

function SidebarSection({ title, items }: SidebarSectionProps) {
  return (
    <div className="pt-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-800" data-testid="sidebar-title">
          Data Lineage
        </h1>
        <p className="text-sm text-slate-500 mt-1" data-testid="sidebar-subtitle">
          Analyze data flow and dependencies
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </div>

        {/* Resources & Tools */}
        <SidebarSection title="Resources & Tools" items={resourceItems} />

        {/* Tests */}
        <SidebarSection title="Tests" items={testItems} />

        {/* Performance */}
        <SidebarSection title="Performance" items={performanceItems} />

        {/* Setup */}
        <SidebarSection title="Setup" items={setupItems} />
      </nav>
    </div>
  );
}
