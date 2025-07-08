declare module '@vscode/sqlite3' {
  namespace sqlite3 {
    interface Database {
      run(sql: string, params?: any[], callback?: (err: Error | null) => void): Database;
      run(sql: string, callback?: (err: Error | null) => void): Database;
      
      get(sql: string, params?: any[], callback?: (err: Error | null, row?: any) => void): Database;
      get(sql: string, callback?: (err: Error | null, row?: any) => void): Database;
      
      all(sql: string, params?: any[], callback?: (err: Error | null, rows?: any[]) => void): Database;
      all(sql: string, callback?: (err: Error | null, rows?: any[]) => void): Database;
      
      each(sql: string, params?: any[], callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Database;
      each(sql: string, callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Database;
      
      exec(sql: string, callback?: (err: Error | null) => void): Database;
      
      prepare(sql: string, params?: any[], callback?: (err: Error | null) => void): Statement;
      prepare(sql: string, callback?: (err: Error | null) => void): Statement;
      
      serialize(callback?: () => void): void;
      parallelize(callback?: () => void): void;
      
      close(callback?: (err: Error | null) => void): void;
      
      on(event: 'error', listener: (err: Error) => void): this;
      on(event: 'open', listener: () => void): this;
      on(event: 'close', listener: () => void): this;
      on(event: 'trace', listener: (sql: string) => void): this;
      on(event: 'profile', listener: (sql: string, time: number) => void): this;
      on(event: string, listener: (...args: any[]) => void): this;
    }

    interface Statement {
      bind(params?: any[], callback?: (err: Error | null) => void): Statement;
      bind(...params: any[]): Statement;
      
      reset(callback?: (err: Error | null) => void): Statement;
      
      finalize(callback?: (err: Error | null) => void): Statement;
      
      run(params?: any[], callback?: (err: Error | null) => void): Statement;
      run(callback?: (err: Error | null) => void): Statement;
      run(...params: any[]): Statement;
      
      get(params?: any[], callback?: (err: Error | null, row?: any) => void): Statement;
      get(callback?: (err: Error | null, row?: any) => void): Statement;
      get(...params: any[]): Statement;
      
      all(params?: any[], callback?: (err: Error | null, rows?: any[]) => void): Statement;
      all(callback?: (err: Error | null, rows?: any[]) => void): Statement;
      all(...params: any[]): Statement;
      
      each(params?: any[], callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Statement;
      each(callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Statement;
    }

    class Database {
      constructor(filename: string, mode?: number, callback?: (err: Error | null) => void);
      constructor(filename: string, callback?: (err: Error | null) => void);
      
      run(sql: string, params?: any[], callback?: (err: Error | null) => void): Database;
      run(sql: string, callback?: (err: Error | null) => void): Database;
      
      get(sql: string, params?: any[], callback?: (err: Error | null, row?: any) => void): Database;
      get(sql: string, callback?: (err: Error | null, row?: any) => void): Database;
      
      all(sql: string, params?: any[], callback?: (err: Error | null, rows?: any[]) => void): Database;
      all(sql: string, callback?: (err: Error | null, rows?: any[]) => void): Database;
      
      each(sql: string, params?: any[], callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Database;
      each(sql: string, callback?: (err: Error | null, row?: any) => void, complete?: (err: Error | null, count: number) => void): Database;
      
      exec(sql: string, callback?: (err: Error | null) => void): Database;
      
      prepare(sql: string, params?: any[], callback?: (err: Error | null) => void): Statement;
      prepare(sql: string, callback?: (err: Error | null) => void): Statement;
      
      serialize(callback?: () => void): void;
      parallelize(callback?: () => void): void;
      
      close(callback?: (err: Error | null) => void): void;
      
      on(event: 'error', listener: (err: Error) => void): this;
      on(event: 'open', listener: () => void): this;
      on(event: 'close', listener: () => void): this;
      on(event: 'trace', listener: (sql: string) => void): this;
      on(event: 'profile', listener: (sql: string, time: number) => void): this;
      on(event: string, listener: (...args: any[]) => void): this;
    }

    const OPEN_READONLY: number;
    const OPEN_READWRITE: number;
    const OPEN_CREATE: number;
    const OPEN_FULLMUTEX: number;
    const OPEN_SHAREDCACHE: number;
    const OPEN_PRIVATECACHE: number;
    const OPEN_URI: number;
  }

  export = sqlite3;
}