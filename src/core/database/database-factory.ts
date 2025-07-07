import { DatabaseAdapter } from './database-adapter';
import { DatabaseConfig } from './types';
import { JSONAdapter } from './adapters/json-adapter';
import { SQLiteAdapter } from './adapters/sqlite-adapter'; // Añadir import
import { Logger } from '../../utils/logger';

export class DatabaseFactory {
  /**
   * Create a database adapter based on configuration
   */
  static create(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'sqlite': // <--- AÑADIR ESTE CASO
        if (!config.sqlite) {
          throw new Error('SQLite configuration required for sqlite adapter');
        }
        return new SQLiteAdapter(config.sqlite);

      case 'json':
        if (!config.json) {
          throw new Error('JSON configuration required for json adapter');
        }
        return new JSONAdapter(config.json);
        
      case 'postgresql':
        if (!config.postgresql) {
          throw new Error('PostgreSQL configuration required for postgresql adapter');
        }
        // TODO: Implement PostgreSQLAdapter
        throw new Error('PostgreSQL adapter not yet implemented');
        
      case 'hybrid':
        if (!config.hybrid) {
          throw new Error('Hybrid configuration required for hybrid adapter');
        }
        // TODO: Implement HybridAdapter (JSON + PostgreSQL)
        throw new Error('Hybrid adapter not yet implemented');
        
      default:
        throw new Error(`Unsupported database type: ${(config as any).type}`);
    }
  }

  /**
   * Create adapter from environment variables
   */
  static createFromEnvironment(): DatabaseAdapter {
    const config = this.getConfigFromEnvironment();
    Logger.info(`Creating database adapter from environment: ${config.type}`);
    return this.create(config);
  }

  /**
   * Create adapter with default JSON configuration
   */
  static createDefault(dbPath: string): DatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'json',
      json: { path: dbPath, maxContexts: 1000 }
    };
    
    Logger.info(`Creating default JSON adapter: ${dbPath}`);
    return this.create(config);
  }

  /**
   * Validate configuration before creating adapter
   */
  static validateConfig(config: DatabaseConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.type) {
      errors.push('Database type is required');
      return { valid: false, errors };
    }

    switch (config.type) {
      case 'json':
        if (!config.json?.path) {
          errors.push('JSON path is required');
        }
        break;
        
      case 'postgresql':
        if (!config.postgresql) {
          errors.push('PostgreSQL configuration is required');
        } else {
          const pg = config.postgresql;
          if (!pg.host) errors.push('PostgreSQL host is required');
          if (!pg.port) errors.push('PostgreSQL port is required');
          if (!pg.database) errors.push('PostgreSQL database is required');
          if (!pg.username) errors.push('PostgreSQL username is required');
          if (!pg.password) errors.push('PostgreSQL password is required');
        }
        break;
        
      case 'hybrid':
        if (!config.hybrid) {
          errors.push('Hybrid configuration is required');
        } else {
          // Validate both JSON and PostgreSQL configs
          const jsonValidation = this.validateConfig({
            type: 'json',
            json: config.hybrid.json
          });
          const pgValidation = this.validateConfig({
            type: 'postgresql',
            postgresql: config.hybrid.postgresql
          });
          
          errors.push(...jsonValidation.errors.map(e => `JSON: ${e}`));
          errors.push(...pgValidation.errors.map(e => `PostgreSQL: ${e}`));
        }
        break;
        
      default:
        errors.push(`Unsupported database type: ${config.type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration from environment variables
   */
  static getConfigFromEnvironment(): DatabaseConfig {
    const dbType = (process.env.DB_TYPE || 'json') as DatabaseConfig['type'];
    
    switch (dbType) {
      case 'json':
        return {
          type: 'json',
          json: {
            path: process.env.JSON_PATH || './context.json',
            maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
          }
        };
        
      case 'postgresql':
        return {
          type: 'postgresql',
          postgresql: {
            host: process.env.PG_HOST || 'localhost',
            port: parseInt(process.env.PG_PORT || '5432'),
            database: process.env.PG_DATABASE || 'context_manager',
            username: process.env.PG_USERNAME || 'postgres',
            password: process.env.PG_PASSWORD || '',
            ssl: process.env.PG_SSL === 'true',
            vectorDimensions: parseInt(process.env.VECTOR_DIMENSIONS || '1536')
          }
        };
        
      case 'hybrid':
        return {
          type: 'hybrid',
          hybrid: {
            json: {
              path: process.env.JSON_PATH || './context.json',
              maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
            },
            postgresql: {
              host: process.env.PG_HOST || 'localhost',
              port: parseInt(process.env.PG_PORT || '5432'),
              database: process.env.PG_DATABASE || 'context_manager',
              username: process.env.PG_USERNAME || 'postgres',
              password: process.env.PG_PASSWORD || '',
              ssl: process.env.PG_SSL === 'true',
              vectorDimensions: parseInt(process.env.VECTOR_DIMENSIONS || '1536')
            },
            syncInterval: parseInt(process.env.SYNC_INTERVAL || '5'),
            maxLocalContexts: parseInt(process.env.MAX_LOCAL_CONTEXTS || '500')
          }
        };
        
      default:
        Logger.warn(`Unknown database type '${dbType}', falling back to JSON`);
        return {
          type: 'json',
          json: {
            path: process.env.JSON_PATH || './context.json',
            maxContexts: parseInt(process.env.MAX_CONTEXTS || '1000')
          }
        };
    }
  }

  /**
   * Get available adapter types
   */
  static getAvailableTypes(): DatabaseConfig['type'][] {
    return ['json']; // TODO: Add 'postgresql', 'hybrid' when implemented
  }

  /**
   * Check if a specific adapter type is available
   */
  static isTypeAvailable(type: DatabaseConfig['type']): boolean {
    const available = this.getAvailableTypes();
    return available.includes(type);
  }

  /**
   * Get recommended configuration for different scenarios
   */
  static getRecommendedConfig(scenario: 'development' | 'production' | 'team'): DatabaseConfig {
    switch (scenario) {
      case 'development':
        return {
          type: 'json',
          json: { path: './dev-context.json', maxContexts: 500 }
        };
        
      case 'production':
        return {
          type: 'postgresql', // PostgreSQL for production
          postgresql: {
            host: 'localhost',
            port: 5432,
            database: 'context_manager_prod',
            username: 'postgres',
            password: '',
            ssl: true,
            vectorDimensions: 1536
          }
        };
        
      case 'team':
        return {
          type: 'hybrid', // Hybrid for team collaboration
          hybrid: {
            json: { path: './team-context.json', maxContexts: 1000 },
            postgresql: {
              host: 'localhost',
              port: 5432,
              database: 'context_manager_team',
              username: 'postgres',
              password: '',
              ssl: true,
              vectorDimensions: 1536
            },
            syncInterval: 5,
            maxLocalContexts: 500
          }
        };
        
      default:
        return this.getRecommendedConfig('development');
    }
  }
}
