import { Search, Filter, Grid3X3, Share, List, Maximize, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TopBar() {
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState("diagram");

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 ml-3 w-5 h-5 text-slate-400 pointer-events-none top-1/2 transform -translate-y-1/2" />
            <Input
              type="text"
              className="w-80 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search tables, columns, datasets..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              data-testid="search-input"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              data-testid="filter-button"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            
            <div className="text-sm text-slate-500">|</div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 rounded ${activeView === "grid" ? "text-slate-600 bg-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveView("grid")}
                data-testid="view-grid-button"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 rounded ${activeView === "diagram" ? "text-slate-600 bg-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveView("diagram")}
                data-testid="view-diagram-button"
              >
                <Share className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 rounded ${activeView === "list" ? "text-slate-600 bg-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                onClick={() => setActiveView("list")}
                data-testid="view-list-button"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-slate-400 hover:text-slate-600 rounded"
            data-testid="expand-button"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-slate-400 hover:text-slate-600 rounded"
            data-testid="settings-button"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
