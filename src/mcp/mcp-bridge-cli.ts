#!/usr/bin/env node

import { MCPBridge } from './mcp-bridge';
import { MCPLogger } from './mcp-logger';

interface CLIConfig {
    port: number;
    host: string;
    workspacePath: string;
    authToken?: string;
}

function parseArgs(): CLIConfig {
    const args = process.argv.slice(2);
    const config: CLIConfig = {
        port: 3001,
        host: 'localhost',
        workspacePath: process.env.WORKSPACE_PATH || process.cwd()
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--port':
            case '-p':
                config.port = parseInt(args[++i]) || 3001;
                break;
            case '--host':
            case '-h':
                config.host = args[++i] || 'localhost';
                break;
            case '--workspace':
            case '-w':
                config.workspacePath = args[++i] || process.cwd();
                break;
            case '--auth':
            case '-a':
                config.authToken = args[++i];
                break;
            case '--help':
                printHelp();
                process.exit(0);
                break;
            default:
                if (arg.startsWith('--')) {
                    MCPLogger.warn(`Unknown option: ${arg}`);
                }
                break;
        }
    }

    return config;
}

function printHelp(): void {
    console.log(`
🌉 MCP HTTP Bridge - Connect Claude to your MCP server

Usage: node mcp-bridge-cli.js [options]

Options:
  -p, --port <port>        Port to run the bridge on (default: 3001)
  -h, --host <host>        Host to bind to (default: localhost)
  -w, --workspace <path>   Workspace path (default: current directory)
  -a, --auth <token>       Authentication token for security
  --help                   Show this help message

Examples:
  node mcp-bridge-cli.js
  node mcp-bridge-cli.js --port 3000 --workspace /path/to/project
  node mcp-bridge-cli.js --auth mysecrettoken

Environment Variables:
  WORKSPACE_PATH          Default workspace path
  MCP_BRIDGE_PORT         Default port
  MCP_BRIDGE_AUTH         Default auth token

Endpoints:
  GET  /health                   - Health check
  GET  /mcp/status              - MCP connection status
  POST /mcp/get_context         - Get project contexts
  POST /mcp/get_active_agents   - Get active agents
  POST /mcp/activate_agent      - Activate specific agent
  GET  /mcp/info                - Bridge information
  POST /mcp/reset               - Reset bridge state
`);
}

async function main(): Promise<void> {
    try {
        const config = parseArgs();
        
        // Override with environment variables if set
        if (process.env.MCP_BRIDGE_PORT) {
            config.port = parseInt(process.env.MCP_BRIDGE_PORT) || config.port;
        }
        if (process.env.MCP_BRIDGE_AUTH) {
            config.authToken = process.env.MCP_BRIDGE_AUTH;
        }

        MCPLogger.info('Starting MCP HTTP Bridge...');
        MCPLogger.info(`Configuration: ${JSON.stringify(config, null, 2)}`);

        const bridge = new MCPBridge(config);
        await bridge.start();

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            MCPLogger.info('Received SIGINT, shutting down gracefully...');
            await bridge.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            MCPLogger.info('Received SIGTERM, shutting down gracefully...');
            await bridge.stop();
            process.exit(0);
        });

        // Keep the process alive
        MCPLogger.info('MCP HTTP Bridge is running. Press Ctrl+C to stop.');
        
    } catch (error) {
        MCPLogger.error('Failed to start MCP HTTP Bridge:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}