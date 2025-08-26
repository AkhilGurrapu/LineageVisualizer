# Interactive Column-Level Data Lineage Dashboard

## Overview

This document outlines the design and architecture for an interactive, column-level data-lineage dashboard that connects to Snowflake and renders in a React frontend. The system provides comprehensive lineage tracking from table-level to granular column-level transformations, with real-time visualization and advanced interactivity features.

**Key Capabilities:**
- Column-level lineage tracking with transformation analysis
- Interactive React Flow visualization with zoom/pan/search
- Snowflake integration via ACCOUNT_USAGE views and ACCESS_HISTORY
- SQL parsing for automatic lineage extraction
- Historical lineage snapshots with time-based filtering
- Role-based access control and data governance

## Architecture

### System Components

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   React Frontend    │    │    Express API       │    │     PostgreSQL      │
│                     │    │                      │    │                     │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────────┐ │
│ │ React Flow      │ │    │ │ GraphQL/REST API │ │    │ │ Tables/Columns  │ │
│ │ - Table Nodes   │ │    │ │ - CRUD Operations│ │    │ │ - Column Lineage│ │
│ │ - Column Nodes  │ │    │ │ - Lineage Query  │ │    │ │ - Transformations│ │
│ │ - Edge Rendering│ │◄───┤ │ - Search/Filter  │ │◄───┤ │ - Quality Rules │ │
│ └─────────────────┘ │    │ └──────────────────┘ │    │ └─────────────────┘ │
│                     │    │                      │    │                     │
│ ┌─────────────────┐ │    │ ┌──────────────────┐ │    │ ┌─────────────────┐ │
│ │ Control Panel   │ │    │ │ Snowflake        │ │    │ │ RBAC & Policies │ │
│ │ - Database Tree │ │    │ │ Connector        │ │    │ │ - Users/Roles   │ │
│ │ - Time Slider   │ │    │ │ - ACCOUNT_USAGE  │ │    │ │ - Permissions   │ │
│ │ - Search/Filter │ │    │ │ - ACCESS_HISTORY │ │    │ │ - Audit Logs    │ │
│ └─────────────────┘ │    │ └──────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │
                          ┌───────────▼───────────┐
                          │   SQL Parser Service  │
                          │                       │
                          │ ┌───────────────────┐ │
                          │ │ ANTLR-based      │ │
                          │ │ Query Analysis    │ │
                          │ │ - Column Mapping  │ │
                          │ │ - JOIN Analysis   │ │
                          │ │ - Transform Logic │ │
                          │ └───────────────────┘ │
                          └───────────────────────┘
```

### Data Flow Architecture

1. **Metadata Ingestion**: Snowflake ACCOUNT_USAGE → SQL Parser → PostgreSQL
2. **API Layer**: TypeScript Express server with GraphQL/REST endpoints
3. **Frontend**: React + React Flow for interactive visualization
4. **Real-time Updates**: WebSocket connections for live lineage changes

## API Design

### GraphQL Schema

```typescript
// Core Data Types
type Database {
  id: ID!
  name: String!
  type: DatabaseType!
  environment: String!
  schemas: [Schema!]!
  createdAt: DateTime!
}

type Schema {
  id: ID!
  name: String!
  database: Database!
  tables: [Table!]!
  schemaType: String! // raw, staging, analytics, marts
}

type Table {
  id: ID!
  name: String!
  schema: Schema!
  columns: [Column!]!
  tableType: TableType! // table, view, materialized_view
  dataClassification: DataClassification
  position: Position! // Canvas coordinates
  tags: [String!]!
  rowCount: Int
  sizeBytes: BigInt
  lastRefreshed: DateTime
}

type Column {
  id: ID!
  name: String!
  table: Table!
  dataType: String!
  isNullable: Boolean!
  isPrimaryKey: Boolean!
  isForeignKey: Boolean!
  isPii: Boolean
  ordinalPosition: Int!
  upstreamLineage: [ColumnLineage!]!
  downstreamLineage: [ColumnLineage!]!
}

type ColumnLineage {
  id: ID!
  sourceColumn: Column!
  targetColumn: Column!
  transformationType: TransformationType!
  transformationLogic: String
  confidence: Int! // 0-100 confidence score
  createdAt: DateTime!
}

enum TransformationType {
  DIRECT        # 1:1 copy
  CALCULATED    # Mathematical/string operations
  AGGREGATED    # SUM, COUNT, AVG, etc.
  FILTERED      # WHERE conditions
  JOINED        # JOIN operations
  UNION         # UNION operations
}

enum DataClassification {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  RESTRICTED
}

// Query Interface
type Query {
  # Database exploration
  databases: [Database!]!
  database(id: ID!): Database
  
  # Table and column queries
  tables(schemaId: ID, search: String, tags: [String!]): [Table!]!
  table(id: ID!): Table
  columns(tableId: ID, search: String): [Column!]!
  column(id: ID!): Column
  
  # Lineage queries
  columnLineage(
    columnId: ID
    depth: Int = 3
    direction: LineageDirection = BOTH
    timeRange: TimeRange
  ): [ColumnLineage!]!
  
  tableLineage(tableId: ID!, depth: Int = 2): [TableLineage!]!
  
  # Search and discovery
  searchColumns(
    query: String!
    filters: ColumnSearchFilters
    limit: Int = 50
  ): ColumnSearchResult!
}

type Mutation {
  # Manual lineage creation
  createColumnLineage(input: CreateColumnLineageInput!): ColumnLineage!
  updateColumnLineage(id: ID!, input: UpdateColumnLineageInput!): ColumnLineage!
  
  # Table position updates for canvas
  updateTablePosition(id: ID!, position: PositionInput!): Table!
  
  # Metadata refresh
  refreshSnowflakeMetadata(databaseId: ID!): RefreshResult!
}

type Subscription {
  # Real-time lineage updates
  lineageUpdated(columnId: ID): ColumnLineage!
  
  # Metadata refresh progress
  metadataRefreshProgress(databaseId: ID!): RefreshProgress!
}
```

### REST API Endpoints (Alternative/Supplementary)

```typescript
// Core CRUD operations
GET    /api/databases
GET    /api/databases/{id}/schemas
GET    /api/schemas/{id}/tables
GET    /api/tables/{id}/columns

// Lineage specific endpoints
GET    /api/column-lineage/upstream/{columnId}?depth=3
GET    /api/column-lineage/downstream/{columnId}?depth=3
GET    /api/column-lineage/path/{sourceId}/{targetId}
POST   /api/column-lineage/batch-create
PUT    /api/tables/{id}/position

// Search and discovery
GET    /api/search/columns?q={query}&tags=pii,sensitive&limit=50
GET    /api/search/tables?q={query}&schema={schemaId}

// Historical lineage
GET    /api/column-lineage/{columnId}/history?from={timestamp}&to={timestamp}
GET    /api/lineage-snapshots?date={YYYY-MM-DD}

// Snowflake integration
POST   /api/snowflake/test-connection
POST   /api/snowflake/ingest-metadata
POST   /api/snowflake/analyze-queries
GET    /api/snowflake/ingestion-status/{jobId}
```

## Front-End Design

### Component Architecture

```typescript
// Main Canvas Component
interface LineageCanvasProps {
  tables: Table[];
  connections: TableLineage[];
  selectedDatabase?: string;
  timeRange?: { from: Date; to: Date };
}

const LineageCanvas: React.FC<LineageCanvasProps> = ({
  tables,
  connections,
  selectedDatabase,
  timeRange
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [lineageMode, setLineageMode] = useState<'table' | 'column'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  
  // React Flow setup
  const nodeTypes = useMemo(() => ({
    table: EnhancedTableNode,
    column: ColumnNode
  }), []);
  
  const edgeTypes = useMemo(() => ({
    lineage: LineageEdge,
    column: ColumnLineageEdge
  }), []);

  // Handle column selection with lineage highlighting
  const handleColumnSelect = useCallback(async (columnId: string) => {
    setSelectedColumn(columnId);
    setLineageMode('column');
    
    // Fetch upstream and downstream lineage
    const [upstream, downstream] = await Promise.all([
      api.getUpstreamLineage(columnId, 3),
      api.getDownstreamLineage(columnId, 3)
    ]);
    
    // Update visualization with highlighted paths
    updateHighlightedPaths([...upstream, ...downstream]);
  }, []);

  return (
    <div className="w-full h-full relative" data-testid="lineage-canvas">
      <DatabaseSelector />
      <SearchPanel />
      <TimeSlider />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      <LineageLegend />
      <SqlLogicPanel />
    </div>
  );
};
```

### Enhanced Table Node Component

```typescript
interface EnhancedTableNodeProps {
  data: {
    table: Table;
    isExpanded: boolean;
    selectedColumn?: string;
    highlightedColumns: Set<string>;
    onColumnSelect: (columnId: string) => void;
    onExpand: (expanded: boolean) => void;
  };
}

const EnhancedTableNode: React.FC<NodeProps<EnhancedTableNodeProps>> = ({ 
  data 
}) => {
  const { table, isExpanded, selectedColumn, highlightedColumns, onColumnSelect } = data;

  return (
    <div className={cn(
      "border rounded-lg bg-white shadow-sm min-w-64",
      selectedColumn && highlightedColumns.size > 0 && "ring-2 ring-blue-500"
    )}>
      {/* Table Header */}
      <div className="bg-slate-100 px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4" />
          <span className="font-medium text-sm">{table.name}</span>
          <Badge variant="secondary" className="text-xs">
            {table.tableType}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => data.onExpand(!isExpanded)}
          data-testid={`button-expand-${table.id}`}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {/* Columns List (when expanded) */}
      {isExpanded && (
        <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
          {table.columns?.map((column) => (
            <div
              key={column.id}
              className={cn(
                "flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-slate-50",
                selectedColumn === column.id && "bg-blue-100",
                highlightedColumns.has(column.id) && "bg-green-50 border border-green-200"
              )}
              onClick={() => onColumnSelect(column.id)}
              data-testid={`column-${column.id}`}
            >
              <div className="flex items-center space-x-2">
                <ColumnIcon className="w-3 h-3 text-slate-500" />
                <span className="font-mono">{column.name}</span>
                {column.isPrimaryKey && <Key className="w-3 h-3 text-yellow-500" />}
                {column.isPii && <Shield className="w-3 h-3 text-red-500" />}
              </div>
              <span className="text-xs text-slate-500">{column.dataType}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#10b981' }}
        data-testid={`source-handle-${table.id}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6' }}
        data-testid={`target-handle-${table.id}`}
      />
    </div>
  );
};
```

### SQL Logic Panel Component

```typescript
interface SqlLogicPanelProps {
  lineage?: ColumnLineage;
  isOpen: boolean;
  onClose: () => void;
}

const SqlLogicPanel: React.FC<SqlLogicPanelProps> = ({
  lineage,
  isOpen,
  onClose
}) => {
  if (!isOpen || !lineage) return null;

  return (
    <div className="absolute right-4 top-4 w-96 bg-white border rounded-lg shadow-lg z-20">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Transformation Logic</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600">Source Column</label>
          <div className="text-sm font-mono bg-slate-100 p-2 rounded">
            {lineage.sourceColumn.table.name}.{lineage.sourceColumn.name}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-600">Target Column</label>
          <div className="text-sm font-mono bg-slate-100 p-2 rounded">
            {lineage.targetColumn.table.name}.{lineage.targetColumn.name}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-600">Transformation Type</label>
          <Badge variant="outline" className="ml-2">
            {lineage.transformationType}
          </Badge>
        </div>
        
        {lineage.transformationLogic && (
          <div>
            <label className="text-sm font-medium text-slate-600">SQL Logic</label>
            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto">
              <code>{lineage.transformationLogic}</code>
            </pre>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Confidence: {lineage.confidence}%</span>
          <span>Last Updated: {formatDate(lineage.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};
```

### Color and Edge Style Conventions

```typescript
// Edge styling based on transformation type
const getEdgeStyle = (transformationType: TransformationType): React.CSSProperties => {
  const styles: Record<TransformationType, React.CSSProperties> = {
    DIRECT: {
      stroke: '#10b981', // emerald-500 - simple copy
      strokeWidth: 2,
      strokeDasharray: '0'
    },
    CALCULATED: {
      stroke: '#3b82f6', // blue-500 - calculations
      strokeWidth: 2,
      strokeDasharray: '5,5'
    },
    AGGREGATED: {
      stroke: '#8b5cf6', // purple-500 - aggregations
      strokeWidth: 3,
      strokeDasharray: '8,3'
    },
    FILTERED: {
      stroke: '#f59e0b', // amber-500 - filtering
      strokeWidth: 2,
      strokeDasharray: '3,3,1,3'
    },
    JOINED: {
      stroke: '#ef4444', // red-500 - joins
      strokeWidth: 3,
      strokeDasharray: '0'
    },
    UNION: {
      stroke: '#06b6d4', // cyan-500 - unions
      strokeWidth: 2,
      strokeDasharray: '10,5'
    }
  };
  
  return styles[transformationType];
};

// Node highlighting based on lineage level
const getNodeStyle = (lineageLevel: 'source' | 'target' | 'intermediate' | null) => {
  switch (lineageLevel) {
    case 'source':
      return 'ring-2 ring-green-500 bg-green-50';
    case 'target': 
      return 'ring-2 ring-blue-500 bg-blue-50';
    case 'intermediate':
      return 'ring-2 ring-yellow-500 bg-yellow-50';
    default:
      return '';
  }
};
```

## Metadata Ingestion

### Snowflake ACCOUNT_USAGE Integration

```typescript
class SnowflakeLineageExtractor {
  
  async extractTableLineage(config: SnowflakeConfig): Promise<TableLineage[]> {
    const query = `
      SELECT DISTINCT
        upstreamTable.TABLE_ID as source_table_id,
        downstreamTable.TABLE_ID as target_table_id,
        ah.QUERY_TYPE as transformation_type,
        ah.QUERY_TEXT as transformation_logic,
        ah.START_TIME as last_executed
      FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah
      JOIN SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES od 
        ON ah.QUERY_ID = od.REFERENCING_QUERY_ID
      JOIN SNOWFLAKE.ACCOUNT_USAGE.TABLES upstreamTable 
        ON od.REFERENCED_OBJECT_NAME = upstreamTable.TABLE_NAME
      JOIN SNOWFLAKE.ACCOUNT_USAGE.TABLES downstreamTable 
        ON od.REFERENCING_OBJECT_NAME = downstreamTable.TABLE_NAME
      WHERE ah.START_TIME >= DATEADD('days', -30, CURRENT_TIMESTAMP())
        AND upstreamTable.TABLE_SCHEMA = '${config.schema}'
        AND downstreamTable.TABLE_SCHEMA = '${config.schema}'
      ORDER BY ah.START_TIME DESC
    `;
    
    return await this.executeQuery<TableLineage>(query);
  }
  
  async extractColumnLineage(config: SnowflakeConfig): Promise<ColumnLineage[]> {
    const query = `
      WITH query_history AS (
        SELECT 
          qh.QUERY_ID,
          qh.QUERY_TEXT,
          qh.START_TIME,
          qh.DATABASE_NAME,
          qh.SCHEMA_NAME
        FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY qh
        WHERE qh.START_TIME >= DATEADD('days', -7, CURRENT_TIMESTAMP())
          AND qh.EXECUTION_STATUS = 'SUCCESS'
          AND qh.QUERY_TYPE IN ('INSERT', 'UPDATE', 'MERGE', 'CREATE_TABLE_AS_SELECT')
          AND qh.DATABASE_NAME = '${config.database}'
          AND qh.SCHEMA_NAME = '${config.schema}'
      ),
      column_access AS (
        SELECT 
          ah.QUERY_ID,
          ah.DIRECT_OBJECTS_ACCESSED,
          ah.BASE_OBJECTS_ACCESSED,
          ah.START_TIME
        FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY ah
        WHERE ah.QUERY_START_TIME >= DATEADD('days', -7, CURRENT_TIMESTAMP())
      )
      SELECT 
        qh.QUERY_ID,
        qh.QUERY_TEXT,
        ca.DIRECT_OBJECTS_ACCESSED,
        ca.BASE_OBJECTS_ACCESSED,
        qh.START_TIME
      FROM query_history qh
      JOIN column_access ca ON qh.QUERY_ID = ca.QUERY_ID
      ORDER BY qh.START_TIME DESC
    `;
    
    const results = await this.executeQuery(query);
    
    // Parse query text to extract column-level lineage
    return await this.parseColumnLineageFromQueries(results);
  }
  
  private async parseColumnLineageFromQueries(
    queries: QueryResult[]
  ): Promise<ColumnLineage[]> {
    const lineages: ColumnLineage[] = [];
    
    for (const query of queries) {
      try {
        const parsedLineage = await this.sqlParser.parseQuery(query.QUERY_TEXT);
        
        for (const lineage of parsedLineage.columnLineages) {
          lineages.push({
            sourceColumnId: lineage.sourceColumn.id,
            targetColumnId: lineage.targetColumn.id,
            transformationType: lineage.transformationType,
            transformationLogic: lineage.expression,
            confidence: lineage.confidence,
            createdAt: query.START_TIME
          });
        }
      } catch (error) {
        console.warn(`Failed to parse query: ${query.QUERY_ID}`, error);
      }
    }
    
    return lineages;
  }
}
```

### ANTLR-Based SQL Parser

```typescript
import { ANTLRInputStream, CommonTokenStream } from 'antlr4';
import { SnowflakeSqlLexer } from './generated/SnowflakeSqlLexer';
import { SnowflakeSqlParser } from './generated/SnowflakeSqlParser';
import { ColumnLineageVisitor } from './visitors/ColumnLineageVisitor';

interface ParsedColumnLineage {
  sourceColumn: { tableName: string; columnName: string; id?: string };
  targetColumn: { tableName: string; columnName: string; id?: string };
  transformationType: TransformationType;
  expression: string;
  confidence: number;
}

interface ParsedQuery {
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'CREATE_TABLE_AS_SELECT' | 'MERGE';
  columnLineages: ParsedColumnLineage[];
  tableReferences: string[];
  errors: string[];
}

class SqlLineageParser {
  
  async parseQuery(sqlText: string): Promise<ParsedQuery> {
    try {
      // Create ANTLR input stream
      const inputStream = new ANTLRInputStream(sqlText);
      const lexer = new SnowflakeSqlLexer(inputStream);
      const tokenStream = new CommonTokenStream(lexer);
      const parser = new SnowflakeSqlParser(tokenStream);
      
      // Parse the SQL
      const tree = parser.sql_script();
      
      // Extract column lineage using visitor pattern
      const visitor = new ColumnLineageVisitor();
      const result = visitor.visit(tree);
      
      return {
        queryType: result.queryType,
        columnLineages: result.columnLineages,
        tableReferences: result.tableReferences,
        errors: result.errors
      };
      
    } catch (error) {
      return {
        queryType: 'SELECT',
        columnLineages: [],
        tableReferences: [],
        errors: [`Parse error: ${error.message}`]
      };
    }
  }
  
  private extractTransformationType(expression: string): TransformationType {
    if (/^[\w.]+$/.test(expression.trim())) {
      return 'DIRECT';
    } else if (/\b(SUM|COUNT|AVG|MIN|MAX|GROUP\s+BY)\b/i.test(expression)) {
      return 'AGGREGATED';
    } else if (/\b(CASE|IF|COALESCE|CONCAT|\+|\-|\*|\/)\b/i.test(expression)) {
      return 'CALCULATED';
    } else if (/\bJOIN\b/i.test(expression)) {
      return 'JOINED';
    } else if (/\bWHERE\b/i.test(expression)) {
      return 'FILTERED';
    } else {
      return 'CALCULATED';
    }
  }
}
```

### Column Lineage Visitor (ANTLR)

```typescript
class ColumnLineageVisitor extends SnowflakeSqlBaseVisitor<ParsedQuery> {
  private columnLineages: ParsedColumnLineage[] = [];
  private tableAliases: Map<string, string> = new Map();
  private currentTargetTable?: string;
  
  visitSelect_statement(ctx: Select_statementContext): ParsedQuery {
    // Extract table aliases from FROM clause
    this.extractTableAliases(ctx.from_clause());
    
    // Extract column mappings from SELECT clause
    this.extractColumnLineages(ctx.select_list(), ctx.from_clause());
    
    return {
      queryType: 'SELECT',
      columnLineages: this.columnLineages,
      tableReferences: Array.from(this.tableAliases.values()),
      errors: []
    };
  }
  
  visitInsert_statement(ctx: Insert_statementContext): ParsedQuery {
    this.currentTargetTable = ctx.table_name().getText();
    
    // Handle INSERT ... SELECT
    if (ctx.select_statement()) {
      const selectLineages = this.visit(ctx.select_statement());
      
      // Map SELECT columns to INSERT columns
      const insertColumns = ctx.column_name_list()?.column_name() || [];
      
      selectLineages.columnLineages.forEach((lineage, index) => {
        if (insertColumns[index]) {
          this.columnLineages.push({
            sourceColumn: lineage.sourceColumn,
            targetColumn: {
              tableName: this.currentTargetTable!,
              columnName: insertColumns[index].getText()
            },
            transformationType: lineage.transformationType,
            expression: lineage.expression,
            confidence: 95
          });
        }
      });
    }
    
    return {
      queryType: 'INSERT',
      columnLineages: this.columnLineages,
      tableReferences: [this.currentTargetTable!],
      errors: []
    };
  }
  
  private extractColumnLineages(
    selectList: Select_listContext, 
    fromClause: From_clauseContext
  ): void {
    const selectItems = selectList.select_item();
    
    selectItems.forEach((item, index) => {
      const expression = item.expression();
      const alias = item.column_alias()?.getText();
      
      if (expression.column_name()) {
        // Simple column reference
        const columnRef = expression.column_name();
        const tableName = this.resolveTableName(columnRef.table_name()?.getText());
        const columnName = columnRef.column_name_simple().getText();
        
        this.columnLineages.push({
          sourceColumn: {
            tableName: tableName,
            columnName: columnName
          },
          targetColumn: {
            tableName: 'result',
            columnName: alias || columnName
          },
          transformationType: 'DIRECT',
          expression: `${tableName}.${columnName}`,
          confidence: 100
        });
        
      } else if (expression.function_call()) {
        // Function calls (aggregations, calculations)
        const funcName = expression.function_call().function_name().getText();
        const args = expression.function_call().expression_list()?.expression() || [];
        
        args.forEach(arg => {
          const columnRef = this.extractColumnFromExpression(arg);
          if (columnRef) {
            this.columnLineages.push({
              sourceColumn: columnRef,
              targetColumn: {
                tableName: 'result',
                columnName: alias || `${funcName}_${index}`
              },
              transformationType: this.isBracesFunction(funcName) ? 'AGGREGATED' : 'CALCULATED',
              expression: expression.getText(),
              confidence: 90
            });
          }
        });
      }
    });
  }
  
  private extractColumnFromExpression(
    expr: ExpressionContext
  ): { tableName: string; columnName: string } | null {
    if (expr.column_name()) {
      const columnRef = expr.column_name();
      const tableName = this.resolveTableName(columnRef.table_name()?.getText());
      const columnName = columnRef.column_name_simple().getText();
      
      return { tableName, columnName };
    }
    
    return null;
  }
  
  private resolveTableName(alias?: string): string {
    if (!alias) return 'unknown';
    return this.tableAliases.get(alias) || alias;
  }
  
  private isAggregateFunction(funcName: string): boolean {
    return ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'GROUP_CONCAT'].includes(funcName.toUpperCase());
  }
}
```

## Implementation Plan

### Phase 1: Enhanced Metadata Ingestion (2-3 weeks)

```typescript
// 1. Upgrade Snowflake connector for ACCOUNT_USAGE
class EnhancedSnowflakeConnector extends SnowflakeConnector {
  
  async harvestLineageMetadata(config: SnowflakeConfig): Promise<LineageMetadata> {
    const [tables, columns, queryHistory, accessHistory] = await Promise.all([
      this.getTables(config),
      this.getColumns(config),
      this.getQueryHistory(config, 7), // Last 7 days
      this.getAccessHistory(config, 7)
    ]);
    
    return {
      tables,
      columns, 
      queryHistory,
      accessHistory
    };
  }
  
  private async getQueryHistory(
    config: SnowflakeConfig, 
    days: number
  ): Promise<QueryHistoryRecord[]> {
    const query = `
      SELECT 
        QUERY_ID,
        QUERY_TEXT,
        QUERY_TYPE,
        START_TIME,
        END_TIME,
        EXECUTION_STATUS,
        DATABASE_NAME,
        SCHEMA_NAME,
        USER_NAME,
        ROLE_NAME
      FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
      WHERE START_TIME >= DATEADD('days', -${days}, CURRENT_TIMESTAMP())
        AND DATABASE_NAME = '${config.database}'
        AND SCHEMA_NAME = '${config.schema}'
        AND EXECUTION_STATUS = 'SUCCESS'
        AND QUERY_TYPE IN ('INSERT', 'UPDATE', 'MERGE', 'CREATE_TABLE_AS_SELECT', 'CREATE_VIEW')
      ORDER BY START_TIME DESC
      LIMIT 10000
    `;
    
    return await this.executeQuery<QueryHistoryRecord>(query);
  }
}

// 2. Implement SQL parser integration
class LineageProcessor {
  
  async processQueryHistory(
    queries: QueryHistoryRecord[],
    existingColumns: Column[]
  ): Promise<ColumnLineage[]> {
    const lineages: ColumnLineage[] = [];
    const parser = new SqlLineageParser();
    
    for (const query of queries) {
      try {
        const parsed = await parser.parseQuery(query.QUERY_TEXT);
        
        for (const lineage of parsed.columnLineages) {
          const sourceColumn = this.findColumnByName(
            lineage.sourceColumn.tableName, 
            lineage.sourceColumn.columnName,
            existingColumns
          );
          
          const targetColumn = this.findColumnByName(
            lineage.targetColumn.tableName,
            lineage.targetColumn.columnName,
            existingColumns
          );
          
          if (sourceColumn && targetColumn) {
            lineages.push({
              sourceColumnId: sourceColumn.id,
              targetColumnId: targetColumn.id,
              transformationType: lineage.transformationType,
              transformationLogic: lineage.expression,
              confidence: lineage.confidence,
              createdAt: query.START_TIME
            });
          }
        }
        
      } catch (error) {
        console.warn(`Failed to process query ${query.QUERY_ID}:`, error);
      }
    }
    
    return lineages;
  }
}
```

### Phase 2: API Enhancement (1-2 weeks)

```typescript
// GraphQL resolver implementation
const resolvers = {
  Query: {
    columnLineage: async (
      parent: any,
      { columnId, depth = 3, direction = 'BOTH', timeRange }: any,
      { dataSources }: GraphQLContext
    ): Promise<ColumnLineage[]> => {
      
      const whereConditions = [`cl.source_column_id = $1 OR cl.target_column_id = $1`];
      const params = [columnId];
      
      if (timeRange) {
        whereConditions.push(`cl.created_at BETWEEN $2 AND $3`);
        params.push(timeRange.from, timeRange.to);
      }
      
      const query = `
        WITH RECURSIVE lineage_tree AS (
          -- Base case
          SELECT 
            cl.*,
            sc.name as source_column_name,
            sc.table_id as source_table_id,
            tc.name as target_column_name,
            tc.table_id as target_table_id,
            1 as level
          FROM column_lineage cl
          JOIN columns sc ON cl.source_column_id = sc.id
          JOIN columns tc ON cl.target_column_id = tc.id
          WHERE ${whereConditions.join(' AND ')}
          
          UNION ALL
          
          -- Recursive case
          SELECT 
            cl.*,
            sc.name as source_column_name,
            sc.table_id as source_table_id,
            tc.name as target_column_name,
            tc.table_id as target_table_id,
            lt.level + 1
          FROM column_lineage cl
          JOIN columns sc ON cl.source_column_id = sc.id
          JOIN columns tc ON cl.target_column_id = tc.id
          JOIN lineage_tree lt ON (
            cl.source_column_id = lt.target_column_id OR
            cl.target_column_id = lt.source_column_id
          )
          WHERE lt.level < $${params.length + 1}
        )
        SELECT DISTINCT * FROM lineage_tree
        ORDER BY level, created_at DESC
      `;
      
      params.push(depth);
      
      const results = await dataSources.database.query(query, params);
      return results.rows;
    },
    
    searchColumns: async (
      parent: any,
      { query, filters, limit = 50 }: any,
      { dataSources }: GraphQLContext
    ): Promise<ColumnSearchResult> => {
      
      let searchQuery = `
        SELECT 
          c.*,
          t.name as table_name,
          s.name as schema_name,
          d.name as database_name,
          ts_rank_cd(
            to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')),
            plainto_tsquery('english', $1)
          ) as rank
        FROM columns c
        JOIN tables t ON c.table_id = t.id
        JOIN schemas s ON t.schema_id = s.id  
        JOIN databases d ON s.database_id = d.id
        WHERE to_tsvector('english', c.name || ' ' || COALESCE(c.description, ''))
              @@ plainto_tsquery('english', $1)
      `;
      
      const params = [query];
      
      if (filters?.dataTypes?.length) {
        searchQuery += ` AND c.data_type = ANY($${params.length + 1})`;
        params.push(filters.dataTypes);
      }
      
      if (filters?.tags?.length) {
        searchQuery += ` AND c.tags ?| $${params.length + 1}`;
        params.push(filters.tags);
      }
      
      if (filters?.isPii !== undefined) {
        searchQuery += ` AND c.is_pii = $${params.length + 1}`;
        params.push(filters.isPii);
      }
      
      searchQuery += `
        ORDER BY rank DESC, c.name
        LIMIT $${params.length + 1}
      `;
      params.push(limit);
      
      const results = await dataSources.database.query(searchQuery, params);
      
      return {
        columns: results.rows,
        totalCount: results.rowCount,
        hasMore: results.rowCount === limit
      };
    }
  },
  
  Mutation: {
    refreshSnowflakeMetadata: async (
      parent: any,
      { databaseId }: any,
      { dataSources, pubsub }: GraphQLContext
    ): Promise<RefreshResult> => {
      
      const jobId = uuidv4();
      
      // Start background job
      setImmediate(async () => {
        try {
          const database = await dataSources.database.findById(databaseId);
          if (!database || database.type !== 'snowflake') {
            throw new Error('Invalid Snowflake database');
          }
          
          const config = parseConnectionString(database.connectionString);
          const connector = new EnhancedSnowflakeConnector();
          
          // Progress: Starting
          pubsub.publish('METADATA_REFRESH_PROGRESS', {
            jobId,
            status: 'STARTING',
            progress: 0,
            message: 'Initializing Snowflake connection'
          });
          
          // Harvest metadata
          const metadata = await connector.harvestLineageMetadata(config);
          
          pubsub.publish('METADATA_REFRESH_PROGRESS', {
            jobId,
            status: 'IN_PROGRESS',
            progress: 25,
            message: 'Processing query history'
          });
          
          // Process lineage
          const processor = new LineageProcessor();
          const lineages = await processor.processQueryHistory(
            metadata.queryHistory,
            metadata.columns
          );
          
          pubsub.publish('METADATA_REFRESH_PROGRESS', {
            jobId,
            status: 'IN_PROGRESS', 
            progress: 75,
            message: 'Storing lineage data'
          });
          
          // Store results
          await dataSources.database.batchInsertColumnLineage(lineages);
          
          pubsub.publish('METADATA_REFRESH_PROGRESS', {
            jobId,
            status: 'COMPLETED',
            progress: 100,
            message: `Processed ${lineages.length} lineage relationships`
          });
          
        } catch (error) {
          pubsub.publish('METADATA_REFRESH_PROGRESS', {
            jobId,
            status: 'FAILED',
            progress: 0,
            message: error.message
          });
        }
      });
      
      return {
        jobId,
        status: 'STARTED',
        message: 'Metadata refresh job started'
      };
    }
  },
  
  Subscription: {
    metadataRefreshProgress: {
      subscribe: (parent: any, { databaseId }: any, { pubsub }: GraphQLContext) => {
        return pubsub.asyncIterator(['METADATA_REFRESH_PROGRESS']);
      }
    }
  }
};
```

### Phase 3: Advanced Frontend Features (2-3 weeks)

```typescript
// Time slider component for historical lineage
const TimeSlider: React.FC = () => {
  const [timeRange, setTimeRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: snapshots } = useQuery({
    queryKey: ['lineage-snapshots', timeRange],
    queryFn: () => api.getLineageSnapshots(timeRange)
  });
  
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white border rounded-lg p-4 shadow-lg">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Historical View</label>
          <input
            type="range"
            min={0}
            max={snapshots?.length - 1 || 0}
            value={snapshots?.findIndex(s => 
              isSameDay(new Date(s.date), selectedDate)
            ) || 0}
            onChange={(e) => {
              const snapshot = snapshots?.[parseInt(e.target.value)];
              if (snapshot) {
                setSelectedDate(new Date(snapshot.date));
              }
            }}
            className="w-full"
          />
        </div>
        
        <div className="text-xs text-slate-600">
          {format(selectedDate, 'MMM dd, yyyy')}
        </div>
        
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Advanced search panel
const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ColumnSearchFilters>({
    dataTypes: [],
    tags: [],
    isPii: undefined,
    dataClassification: undefined
  });
  
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['column-search', query, filters],
    queryFn: () => api.searchColumns({ query, filters, limit: 100 }),
    enabled: query.length > 2
  });
  
  return (
    <div className="absolute top-4 right-4 z-10 w-96">
      <div className="bg-white border rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search columns, tables, or descriptions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b space-y-3">
          <div>
            <label className="text-sm font-medium">Data Types</label>
            <Select
              multiple
              value={filters.dataTypes}
              onValueChange={(value) => setFilters(f => ({ ...f, dataTypes: value }))}
            >
              <SelectItem value="VARCHAR">VARCHAR</SelectItem>
              <SelectItem value="NUMBER">NUMBER</SelectItem>
              <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
              <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Contains PII</label>
            <RadioGroup
              value={filters.isPii?.toString() || 'all'}
              onValueChange={(value) => setFilters(f => ({
                ...f,
                isPii: value === 'all' ? undefined : value === 'true'
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" />
                <label>All</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" />
                <label>PII Only</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" />
                <label>No PII</label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        {/* Results */}
        {query.length > 2 && (
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 rounded-full mx-auto"></div>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults?.columns.map((column) => (
                  <div
                    key={column.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleColumnSelect(column.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {column.table.schema.database.name}.{column.table.schema.name}.{column.table.name}.{column.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {column.dataType}
                          {column.isPii && (
                            <Badge variant="destructive" className="ml-2 text-xs">PII</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Phase 4: Performance Optimization (1-2 weeks)

```typescript
// Implement caching and performance optimizations
class LineageCacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  async getColumnLineage(
    columnId: string,
    depth: number,
    direction: 'upstream' | 'downstream' | 'both'
  ): Promise<ColumnLineage[] | null> {
    const cacheKey = `lineage:${columnId}:${depth}:${direction}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }
  
  async setColumnLineage(
    columnId: string,
    depth: number,
    direction: string,
    data: ColumnLineage[],
    ttlSeconds: number = 300 // 5 minutes
  ): Promise<void> {
    const cacheKey = `lineage:${columnId}:${depth}:${direction}`;
    await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(data));
  }
  
  async invalidateColumnLineage(columnId: string): Promise<void> {
    const pattern = `lineage:${columnId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Database query optimizations
class OptimizedLineageQueries {
  
  // Optimized query with proper indexing strategy
  async getColumnLineageUpstream(
    columnId: string,
    depth: number = 3
  ): Promise<ColumnLineage[]> {
    const query = `
      WITH RECURSIVE upstream_lineage AS (
        -- Base case: direct upstream
        SELECT 
          cl.id,
          cl.source_column_id,
          cl.target_column_id,
          cl.transformation_type,
          cl.transformation_logic,
          cl.confidence,
          cl.created_at,
          1 as level,
          ARRAY[cl.target_column_id, cl.source_column_id] as path
        FROM column_lineage cl
        WHERE cl.target_column_id = $1
        
        UNION ALL
        
        -- Recursive case: traverse upstream
        SELECT 
          cl.id,
          cl.source_column_id,
          cl.target_column_id,
          cl.transformation_type,
          cl.transformation_logic,
          cl.confidence,
          cl.created_at,
          ul.level + 1,
          ul.path || cl.source_column_id
        FROM column_lineage cl
        JOIN upstream_lineage ul ON cl.target_column_id = ul.source_column_id
        WHERE ul.level < $2
          AND NOT (cl.source_column_id = ANY(ul.path)) -- Prevent cycles
      )
      SELECT 
        ul.*,
        sc.name as source_column_name,
        st.name as source_table_name,
        ss.name as source_schema_name,
        sd.name as source_database_name,
        tc.name as target_column_name,
        tt.name as target_table_name,
        ts.name as target_schema_name,
        td.name as target_database_name
      FROM upstream_lineage ul
      JOIN columns sc ON ul.source_column_id = sc.id
      JOIN tables st ON sc.table_id = st.id
      JOIN schemas ss ON st.schema_id = ss.id
      JOIN databases sd ON ss.database_id = sd.id
      JOIN columns tc ON ul.target_column_id = tc.id
      JOIN tables tt ON tc.table_id = tt.id
      JOIN schemas ts ON tt.schema_id = ts.id
      JOIN databases td ON ts.database_id = td.id
      ORDER BY ul.level, ul.created_at DESC
    `;
    
    const result = await this.database.query(query, [columnId, depth]);
    return result.rows;
  }
}

// Frontend performance optimizations
const MemoizedTableNode = React.memo(EnhancedTableNode, (prevProps, nextProps) => {
  return (
    prevProps.data.table.id === nextProps.data.table.id &&
    prevProps.data.isExpanded === nextProps.data.isExpanded &&
    prevProps.data.selectedColumn === nextProps.data.selectedColumn &&
    prevProps.data.highlightedColumns.size === nextProps.data.highlightedColumns.size
  );
});

// Virtualized column list for large tables
const VirtualizedColumnList: React.FC<{
  columns: Column[];
  onColumnSelect: (columnId: string) => void;
}> = ({ columns, onColumnSelect }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });
  
  return (
    <div
      ref={parentRef}
      className="max-h-96 overflow-auto"
      style={{
        height: `400px`,
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ColumnItem
              column={columns[virtualItem.index]}
              onClick={() => onColumnSelect(columns[virtualItem.index].id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|-------------------|
| **Query Volume Scaling** | High | Medium | • Implement request throttling and caching<br>• Use connection pooling<br>• Add Redis for frequent queries<br>• Implement query result pagination |
| **Snowflake API Limits** | High | Medium | • Respect rate limits with exponential backoff<br>• Cache ACCOUNT_USAGE query results<br>• Use incremental refresh strategies<br>• Monitor warehouse credit consumption |
| **SQL Parsing Complexity** | Medium | High | • Start with simple queries, expand gradually<br>• Implement confidence scoring<br>• Allow manual lineage override<br>• Use fallback to pattern matching for unparseable queries |
| **Large Graph Performance** | High | Medium | • Implement graph virtualization<br>• Use level-of-detail rendering<br>• Add clustering for related nodes<br>• Implement on-demand loading |
| **PostgreSQL Scaling** | Medium | Medium | • Implement proper indexing strategy<br>• Use connection pooling<br>• Add read replicas for queries<br>• Consider graph database for complex traversals |

### Security Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|-------------------|
| **Snowflake Credential Exposure** | High | Low | • Use environment variables only<br>• Implement credential rotation<br>• Use least-privilege access principles<br>• Audit access logs regularly |
| **Data Exposure via Lineage** | High | Medium | • Implement column-level security<br>• Add data classification checks<br>• Use RBAC for sensitive lineage<br>• Audit lineage access patterns |
| **Privilege Escalation** | Medium | Low | • Regular security audits<br>• Principle of least privilege<br>• Role-based access controls<br>• Session management |

### Operational Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|-------------------|
| **Snowflake Schema Changes** | Medium | Medium | • Implement change detection<br>• Add schema versioning<br>• Create alerts for structural changes<br>• Maintain schema change logs |
| **Lineage Drift** | Medium | High | • Regular validation against source<br>• Automated freshness checks<br>• User feedback mechanisms<br>• Confidence score monitoring |
| **Dashboard Downtime** | Medium | Low | • Implement health checks<br>• Add monitoring and alerting<br>• Use graceful degradation<br>• Maintain backup systems |

### Mitigation Implementation

```typescript
// Comprehensive error handling and resilience
class ResilientSnowflakeConnector {
  private maxRetries = 3;
  private backoffMs = 1000;
  private rateLimiter = new RateLimiter({ tokensPerInterval: 10, interval: 'second' });
  
  async executeQueryWithResilience<T>(query: string): Promise<T[]> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Rate limiting
        await this.rateLimiter.removeTokens(1);
        
        const result = await this.executeQuery<T>(query);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        if (this.isRateLimitError(error)) {
          const backoffTime = this.backoffMs * Math.pow(2, attempt);
          await this.sleep(backoffTime);
          continue;
        }
        
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        await this.sleep(this.backoffMs * Math.pow(2, attempt));
      }
    }
    
    throw new Error(`Query failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }
  
  private isRetryableError(error: any): boolean {
    return error.message.includes('timeout') || 
           error.message.includes('connection') ||
           error.code === 'ECONNRESET';
  }
  
  private isRateLimitError(error: any): boolean {
    return error.message.includes('rate limit') || 
           error.code === 429;
  }
}

// Comprehensive monitoring
class LineageMonitor {
  async checkLineageFreshness(): Promise<FreshnessReport> {
    const staleThresholdHours = 24;
    const query = `
      SELECT 
        COUNT(*) as total_lineages,
        COUNT(CASE WHEN updated_at < NOW() - INTERVAL '${staleThresholdHours} hours' THEN 1 END) as stale_lineages
      FROM column_lineage
    `;
    
    const result = await this.database.query(query);
    const { total_lineages, stale_lineages } = result.rows[0];
    
    return {
      totalLineages: parseInt(total_lineages),
      staleLineages: parseInt(stale_lineages),
      freshnessPercentage: ((total_lineages - stale_lineages) / total_lineages) * 100,
      lastUpdated: new Date()
    };
  }
  
  async validateLineageIntegrity(): Promise<IntegrityReport> {
    const issues: IntegrityIssue[] = [];
    
    // Check for orphaned lineages
    const orphanedQuery = `
      SELECT cl.id
      FROM column_lineage cl
      LEFT JOIN columns sc ON cl.source_column_id = sc.id
      LEFT JOIN columns tc ON cl.target_column_id = tc.id
      WHERE sc.id IS NULL OR tc.id IS NULL
    `;
    
    const orphanedResults = await this.database.query(orphanedQuery);
    
    if (orphanedResults.rowCount > 0) {
      issues.push({
        type: 'ORPHANED_LINEAGE',
        count: orphanedResults.rowCount,
        description: 'Column lineages pointing to deleted columns'
      });
    }
    
    return {
      issues,
      isHealthy: issues.length === 0,
      lastChecked: new Date()
    };
  }
}
```

## Success Metrics

### Performance Metrics

```typescript
interface PerformanceMetrics {
  // Render performance
  canvasRenderTime: number;      // Target: <200ms for 500 nodes
  nodeUpdateLatency: number;     // Target: <50ms per node update
  edgeRenderTime: number;        // Target: <100ms for 1000 edges
  
  // Query performance  
  lineageQueryTime: number;      // Target: <500ms for 3-level depth
  searchResponseTime: number;    // Target: <300ms for text search
  metadataFreshness: number;     // Target: <5min staleness
  
  // User interaction
  columnSelectionResponse: number; // Target: <100ms
  zoomPanPerformance: number;      // Target: 60fps during interaction
  
  // System performance
  memoryUsage: number;           // Target: <512MB for frontend
  cpuUsage: number;             // Target: <80% during peak load
}

const performanceMonitor = {
  async measureRenderTime(nodeCount: number): Promise<number> {
    const start = performance.now();
    
    // Simulate rendering 500 nodes
    await new Promise(resolve => {
      requestIdleCallback(() => {
        // Render logic here
        resolve(undefined);
      });
    });
    
    const end = performance.now();
    return end - start;
  },
  
  async measureLineageQuery(columnId: string, depth: number): Promise<number> {
    const start = performance.now();
    await api.getColumnLineage(columnId, depth);
    const end = performance.now();
    
    return end - start;
  }
};
```

### User Experience Metrics

```typescript
interface UXMetrics {
  // Discoverability
  averageColumnsFoundPerSearch: number;  // Target: >5 relevant results
  searchSuccessRate: number;             // Target: >80% find what they need
  
  // Usability  
  averageTimeToFindLineage: number;      // Target: <30 seconds
  lineagePathCompletionRate: number;     // Target: >90% complete paths
  userSatisfactionScore: number;         // Target: >4.0/5.0
  
  // Engagement
  sessionsPerUser: number;               // Target: >2 sessions/week
  averageSessionDuration: number;        // Target: >10 minutes
  featureAdoptionRate: number;          // Target: >70% use column mode
}
```

### Data Quality Metrics

```typescript
interface DataQualityMetrics {
  // Lineage accuracy
  lineageConfidenceScore: number;        // Target: >90% average confidence
  manualOverrideRate: number;           // Target: <10% need manual correction
  falsePositiveRate: number;            // Target: <5% incorrect lineages
  
  // Coverage
  tablesWithLineage: number;            // Target: >95% have some lineage
  columnsWithLineage: number;           // Target: >80% have lineage data
  
  // Freshness
  avgLineageAge: number;                // Target: <24 hours average age
  staleBranchCount: number;             // Target: <5% stale branches
}

const qualityMonitor = {
  async calculateConfidenceDistribution(): Promise<ConfidenceDistribution> {
    const query = `
      SELECT 
        confidence,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM column_lineage 
      GROUP BY confidence 
      ORDER BY confidence DESC
    `;
    
    const result = await database.query(query);
    return {
      distribution: result.rows,
      averageConfidence: result.rows.reduce((acc, row) => 
        acc + (row.confidence * row.count), 0
      ) / result.rows.reduce((acc, row) => acc + row.count, 0)
    };
  }
};
```

### Monitoring Dashboard

```typescript
// Real-time metrics collection
const MetricsDashboard: React.FC = () => {
  const { data: performanceMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => api.getPerformanceMetrics(),
    refetchInterval: 30000 // 30 seconds
  });
  
  const { data: qualityMetrics } = useQuery({
    queryKey: ['data-quality-metrics'],
    queryFn: () => api.getDataQualityMetrics(),
    refetchInterval: 300000 // 5 minutes
  });
  
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Performance Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Render Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {performanceMetrics?.canvasRenderTime}ms
          </div>
          <div className={cn(
            "text-sm",
            performanceMetrics?.canvasRenderTime < 200 ? "text-green-600" : "text-red-600"
          )}>
            Target: <200ms
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lineage Query Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {performanceMetrics?.lineageQueryTime}ms
          </div>
          <div className={cn(
            "text-sm",
            performanceMetrics?.lineageQueryTime < 500 ? "text-green-600" : "text-red-600"
          )}>
            Target: <500ms
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Freshness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(performanceMetrics?.metadataFreshness / 60)}min
          </div>
          <div className={cn(
            "text-sm",
            performanceMetrics?.metadataFreshness < 300 ? "text-green-600" : "text-red-600"
          )}>
            Target: <5min
          </div>
        </CardContent>
      </Card>
      
      {/* Quality Charts */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Lineage Confidence Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={qualityMetrics?.confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="confidence" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Coverage Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>Tables with Lineage</span>
              <span>{qualityMetrics?.tablesWithLineage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${qualityMetrics?.tablesWithLineage}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm">
              <span>Columns with Lineage</span>
              <span>{qualityMetrics?.columnsWithLineage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${qualityMetrics?.columnsWithLineage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Next Steps

### Immediate Actions (Week 1)

1. **Environment Setup**
   - Configure ACCOUNT_USAGE permissions in Snowflake
   - Set up PostgreSQL indexes for lineage queries
   - Install and configure SQL parser dependencies

2. **Core Integration**
   - Extend existing SnowflakeConnector with ACCOUNT_USAGE queries
   - Implement basic SQL parsing for common patterns
   - Add column lineage API endpoints to existing routes

3. **UI Enhancement**
   - Enhance existing LineageCanvas with column-level highlighting
   - Add search panel component
   - Implement basic time filtering

### Short-term Goals (Month 1)

1. **Advanced Parsing**
   - Complete ANTLR grammar for Snowflake SQL dialect
   - Implement confidence scoring algorithms
   - Add support for complex transformations (CTEs, window functions)

2. **Performance Optimization**
   - Implement caching layer with Redis
   - Add database query optimization
   - Implement graph virtualization for large datasets

3. **User Experience**
   - Add comprehensive search and filtering
   - Implement time slider for historical lineage
   - Create SQL logic inspection panel

### Long-term Vision (3-6 months)

1. **Enterprise Features**
   - Multi-tenant support with RBAC
   - Data governance integration
   - Compliance reporting and audit trails

2. **Advanced Analytics**
   - Impact analysis for schema changes
   - Data quality correlation with lineage
   - Usage analytics and optimization recommendations

3. **Ecosystem Integration**
   - dbt integration for transformation documentation
   - Data catalog synchronization
   - CI/CD pipeline integration for lineage validation

---

*This design document serves as a comprehensive blueprint for implementing a production-ready, column-level data lineage dashboard. The architecture builds upon modern web technologies and follows industry best practices for scalability, performance, and maintainability.*