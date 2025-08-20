import snowflake from 'snowflake-sdk';
import fs from 'fs/promises';
import path from 'path';

interface SnowflakeConfig {
  account: string;
  user: string;
  role: string;
  warehouse: string;
  database: string;
  schema: string;
}

interface SnowflakeTable {
  table_name: string;
  table_type: string;
  table_schema: string;
  table_catalog: string;
  row_count?: number;
  bytes?: number;
  comment?: string;
}

interface SnowflakeColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  ordinal_position: number;
  column_default?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  comment?: string;
}

class SnowflakeConnector {
  private connection: any = null;

  async connect(config: SnowflakeConfig): Promise<void> {
    if (!process.env.SNOWFLAKE_PAT) {
      throw new Error('SNOWFLAKE_PAT environment variable is required');
    }

    return new Promise((resolve, reject) => {
      this.connection = snowflake.createConnection({
        account: config.account,
        username: config.user,
        authenticator: 'OAUTH',
        token: process.env.SNOWFLAKE_PAT,
        role: config.role,
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema
      });

      this.connection.connect((err: any, conn: any) => {
        if (err) {
          console.error('Snowflake connection error:', err);
          reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
        } else {
          console.log('Successfully connected to Snowflake');
          resolve();
        }
      });
    });
  }

  async executeQuery<T = any>(query: string): Promise<T[]> {
    if (!this.connection) {
      throw new Error('Not connected to Snowflake');
    }

    return new Promise((resolve, reject) => {
      this.connection.execute({
        sqlText: query,
        complete: (err: any, stmt: any, rows: T[]) => {
          if (err) {
            console.error('Query execution error:', err);
            reject(new Error(`Query failed: ${err.message}`));
          } else {
            resolve(rows || []);
          }
        }
      });
    });
  }

  async testConnection(config: SnowflakeConfig): Promise<{ success: boolean; tableCount?: number; error?: string }> {
    try {
      await this.connect(config);
      
      // Test with a simple query to count tables
      const query = `
        SELECT COUNT(*) as table_count 
        FROM ${config.database}.INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '${config.schema}'
      `;
      
      const result = await this.executeQuery<{ TABLE_COUNT: number }>(query);
      const tableCount = result[0]?.TABLE_COUNT || 0;
      
      return { success: true, tableCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.disconnect();
    }
  }

  async getTables(config: SnowflakeConfig): Promise<SnowflakeTable[]> {
    await this.connect(config);
    
    const query = `
      SELECT 
        TABLE_NAME,
        TABLE_TYPE,
        TABLE_SCHEMA,
        TABLE_CATALOG,
        ROW_COUNT,
        BYTES,
        COMMENT
      FROM ${config.database}.INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${config.schema}'
      ORDER BY TABLE_NAME
    `;
    
    return await this.executeQuery<SnowflakeTable>(query);
  }

  async getColumns(config: SnowflakeConfig, tableName?: string): Promise<SnowflakeColumn[]> {
    await this.connect(config);
    
    let whereClause = `WHERE TABLE_SCHEMA = '${config.schema}'`;
    if (tableName) {
      whereClause += ` AND TABLE_NAME = '${tableName}'`;
    }
    
    const query = `
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        ORDINAL_POSITION,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        COMMENT
      FROM ${config.database}.INFORMATION_SCHEMA.COLUMNS 
      ${whereClause}
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;
    
    return await this.executeQuery<SnowflakeColumn>(query);
  }

  async getViews(config: SnowflakeConfig): Promise<SnowflakeTable[]> {
    await this.connect(config);
    
    const query = `
      SELECT 
        TABLE_NAME,
        'VIEW' as TABLE_TYPE,
        TABLE_SCHEMA,
        TABLE_CATALOG,
        NULL as ROW_COUNT,
        NULL as BYTES,
        COMMENT
      FROM ${config.database}.INFORMATION_SCHEMA.VIEWS 
      WHERE TABLE_SCHEMA = '${config.schema}'
      ORDER BY TABLE_NAME
    `;
    
    return await this.executeQuery<SnowflakeTable>(query);
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.destroy((err: any) => {
        if (err) {
          console.error('Error disconnecting from Snowflake:', err);
        } else {
          console.log('Disconnected from Snowflake');
        }
      });
      this.connection = null;
    }
  }
}

export { SnowflakeConnector, type SnowflakeConfig, type SnowflakeTable, type SnowflakeColumn };